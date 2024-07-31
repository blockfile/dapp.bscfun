const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const Bottleneck = require("bottleneck");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Sphere = require("./model/models");
const Web3 = require("web3");

dotenv.config();
app.use(express.static("public"));
app.use(express.json()); // To parse JSON bodies

const corsOptions = {
    origin: "http://localhost:3000", // or your specific origin
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Enable CORS for the specified origin
const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 200, // milliseconds
});

dotenv.config();

mongoose
    .connect(process.env.DATABASE_ACCESS)
    .then(() => console.log("DATABASE CONNECTED"))
    .catch((err) => console.error("Error connecting to the database:", err));

app.get("/api/trending", async (req, res) => {
    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/search/trending"
        );
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching trending coins:", error.message);
        res.status(500).send("Error fetching trending coins");
    }
});
const fetchBalance = limiter.wrap(async (contractAddress, address, apiKey) => {
    const balanceUrl = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${apiKey}`;
    const balanceResponse = await axios.get(balanceUrl);
    return balanceResponse.data.result;
});

const cache = {};

app.get("/api/top-coins", async (req, res) => {
    try {
        const params = {
            start: 1,
            limit: 10,
            convert: "USD",
        };
        const headers = {
            "X-CMC_PRO_API_KEY": "32a754d9-74d0-4999-8dde-687ab544f7b1",
        };
        const response = await axios.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
            { params, headers }
        );
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});
const getChainId = (network) => {
    const networkMap = {
        BSC: "56",
        Ethereum: "1",
    };
    return networkMap[network] || "56"; // Default to BSC if network not found
};

// In your Express server file

app.get("/api/token-details/:trans_token", async (req, res) => {
    try {
        const trans_token = req.params.trans_token;
        console.log("Requested trans_token:", trans_token);
        const token = await Sphere.findOne({ trans_token });
        if (!token) {
            return res.status(404).send("Token not found");
        }
        res.json(token);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post("/lock-token", async (req, res) => {
    let {
        tokenName,
        contractAddress,
        amountLocked,
        lockDuration,
        date,
        accountLocker,
        trans_token,
        lockIndex,
        tokenSymbol,
        points,
    } = req.body;

    try {
        // Convert contractAddress to checksum format
        contractAddress = Web3.utils.toChecksumAddress(contractAddress);

        // Create a new document with the checksummed address
        const newLock = new Sphere({
            tokenName,
            contractAddress,
            amountLocked,
            lockDuration,
            date: new Date(date),
            accountLocker,
            trans_token,
            lockIndex,
            tokenSymbol,
            points,
            status: "Locked",
        });

        const savedLock = await newLock.save();
        res.status(201).json(savedLock);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
app.post("/unlock-token", async (req, res) => {
    const { accountLocker, contractAddress, lockIndex, status, unlockedDate } =
        req.body;

    try {
        await Sphere.findOneAndUpdate(
            {
                accountLocker: accountLocker,
                contractAddress: contractAddress,
                lockIndex: lockIndex,
            },
            { $set: { status: status, unlockedDate: unlockedDate } }
        );
        res.status(200).json({
            message: "Token unlock status updated successfully",
        });
    } catch (error) {
        console.error("Error updating token unlock status:", error);
        res.status(500).json({ message: "Error updating token unlock status" });
    }
});

app.get("/tokens", async (req, res) => {
    const { address } = req.query;
    const apiKey = "JUDPV627WC6YPRF9PJ992PQ4MMAIZVCDVV";
    const chainId = "56"; // Replace with the appropriate chain ID

    try {
        const txUrl = `https://api.bscscan.com/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`;
        const txResponse = await axios.get(txUrl);

        if (txResponse.data.status === "0") {
            throw new Error(txResponse.data.result);
        }

        const transactions = txResponse.data.result;

        if (Array.isArray(transactions)) {
            const contractAddresses = [
                ...new Set(transactions.map((tx) => tx.contractAddress)),
            ];

            const tokenBalances = await Promise.all(
                contractAddresses.map(async (contractAddress) => {
                    try {
                        const balance = await fetchBalance(
                            contractAddress,
                            address,
                            apiKey
                        );
                        const tokenData = await getGoPlusTokenData(
                            contractAddress,
                            chainId
                        );

                        let logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${contractAddress}/logo.png`;

                        // Check if the logo exists, if not use fallback
                        const logoExists = await checkLogoExists(logoUrl);
                        if (!logoExists) {
                            // Adjust the path according to where your static files are served from
                            logoUrl = "empty-token.svg";
                        }

                        return {
                            tokenName: tokenData.name, // Name from GoPlus API
                            balance,
                            contractAddress,

                            logoUrl,
                        };
                    } catch (error) {
                        console.error(
                            `Error fetching balance for contract ${contractAddress}: `,
                            error
                        );
                        return null;
                    }
                })
            );

            const validBalances = tokenBalances.filter(
                (token) => token && token.balance !== "0"
            );
            res.json(validBalances);
        } else {
            res.status(500).json({
                error: "BscScan API response was not an array.",
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function getGoPlusTokenData(tokenAddress, chainId) {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`;
    try {
        const response = await axios.get(url);
        if (
            response.data &&
            response.data.result &&
            response.data.result[tokenAddress]
        ) {
            return {
                name: response.data.result[tokenAddress].token_name,
                symbol: response.data.result[tokenAddress].token_symbol,
            };
        } else {
            return null; // No data found for this token
        }
    } catch (error) {
        console.error("Error fetching token data from GoPlus API:", error);
        return null;
    }
}
app.get("/api/get-token-data/:tokenAddress", async (req, res) => {
    const { tokenAddress } = req.params;

    const chainId = "56";
    try {
        const tokenData = await getGoPlusTokenData(tokenAddress, chainId);

        res.json({
            success: true,
            data: tokenData,
        });
    } catch (error) {
        console.error("Error in /api/get-token-data:", error);
        res.status(500).json({
            success: false,
            error: "Could not fetch token data.",
        });
    }
});
app.get("/token-data", async (req, res) => {
    const { address } = req.query;
    try {
        const tokenData = await getBlockchainTokenData(address);
        // If you don't have a specific logo URL, you might use a default URL
        let logoUrl =
            tokenData.logoUrl || "./components/Images/empty-token.svg";

        // Check if the logo URL actually exists
        const logoExists = await checkLogoExists(logoUrl);
        if (!logoExists) {
            logoUrl = "./components/Images/empty-token.svg"; // Replace with your default logo path
        }

        res.json({
            success: true,
            name: tokenData.name,
            logo: logoUrl,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Could not fetch token data.",
        });
    }
});
const checkLogoExists = async (logoUrl) => {
    try {
        const response = await axios.head(logoUrl);
        return response.status === 200;
    } catch (error) {
        return false;
    }
};

app.get("/token-security", async (req, res) => {
    const network = req.query.network;
    const chainId = getChainId(network);
    const contractAddresses = req.query.contractAddresses;

    if (!contractAddresses) {
        return res
            .status(400)
            .send("contractAddresses query parameter is required");
    }

    try {
        const goplusResponse = await fetch(
            `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${contractAddresses}`
        );

        // Check if the response from GoPlus API was not OK (e.g., 400, 500 status codes)
        if (!goplusResponse.ok) {
            const errorResponse = await goplusResponse.json();
            console.error("Error from GoPlus API:", errorResponse);
            return res.status(500).json({
                error: `Failed to fetch data from GoPlus API: ${errorResponse.message}`,
            });
        }

        // If the response was OK, proceed to send back the data
        const data = await goplusResponse.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Server error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

//FETCHING DATA on DB
app.get("/api/tokens", async (req, res) => {
    try {
        // Fetch tokens from the database including the contractAddress and date
        const tokens = await Sphere.find({})
            .select(
                "tokenName accountLocker amountLocked lockDuration trans_token contractAddress date -_id"
            )
            .sort({ date: -1 }); // Sorting by date in descending order

        // Map over the tokens to add the logoUrl for each token
        const tokensWithLogos = tokens.map((token) => {
            const tokenObj = token.toObject();
            tokenObj.logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${token.contractAddress}/logo.png`;

            return tokenObj;
        });

        res.json(tokensWithLogos);
    } catch (error) {
        res.status(500).send(error);
    }
});

//
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

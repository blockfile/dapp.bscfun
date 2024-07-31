import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import makeBlockie from "ethereum-blockies-base64";
import Web3 from "web3";
import Grid from "@mui/material/Unstable_Grid2";
import logoSphere from "../../../components/images/logo.png";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import emptyTokenImage from "../../../components/images/empty-token.svg";
import Highcharts from "highcharts";
import variablePie from "highcharts/modules/variable-pie.js";
import HC_accessibility from "highcharts/modules/accessibility";

function TokenDetails() {
    // Initialize the modules
    variablePie(Highcharts);
    HC_accessibility(Highcharts);
    const { trans_token } = useParams();
    const [tokenDetails, setTokenDetails] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState("");
    const [blockieImage, setBlockieImage] = useState("");
    const [web3, setWeb3] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [tokenData, setTokenData] = useState(null);
    const [isLPToken, setIsLPToken] = useState(false);

    useEffect(() => {
        const fetchTokenDetailsAndPrice = async () => {
            try {
                const tokenDetailsResponse = await axios.get(
                    `http://localhost:3001/api/token-details/${trans_token}`
                );
                const contractAddress =
                    tokenDetailsResponse.data.contractAddress;

                const goplusResponse = await axios.get(
                    `https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=${contractAddress}`
                );

                let isLPTokenDetected =
                    goplusResponse.data.result[contractAddress.toLowerCase()]
                        ?.is_in_dex === "1" ||
                    goplusResponse.data.result[contractAddress.toLowerCase()]
                        ?.dex?.length > 0;

                let totalSupply = 0,
                    lockedSupply = 0,
                    unlockedSupply = 0,
                    pairAddress = "";

                if (isLPTokenDetected) {
                    const lpTokenData =
                        goplusResponse.data.result[
                            contractAddress.toLowerCase()
                        ];
                    let totalBalance = 0;
                    let lockedBalance = 0;

                    lpTokenData.holders.forEach((holder) => {
                        const holderBalance = parseFloat(holder.balance);
                        totalBalance += holderBalance;

                        if (holder.is_locked === 1) {
                            lockedBalance += holderBalance;
                        }
                    });

                    unlockedSupply = totalBalance - lockedBalance;
                    pairAddress = lpTokenData.dex[0]?.pair || "";

                    setTokenData({
                        totalSupply: totalBalance,
                        lockedSupply: lockedBalance,
                        unlockedSupply: unlockedSupply,
                    });
                }

                setIsLPToken(isLPTokenDetected);
                const addressForPriceFetching = pairAddress || contractAddress;
                const dexScreenerResponse = await axios.get(
                    `https://api.dexscreener.com/latest/dex/pairs/bsc/${addressForPriceFetching}`
                );

                let priceUsd = 0;
                if (dexScreenerResponse.data.pairs.length > 0) {
                    priceUsd = dexScreenerResponse.data.pairs[0].priceUsd;
                }

                setTokenDetails((prevDetails) => ({
                    ...prevDetails,
                    ...tokenDetailsResponse.data,
                    priceUsd,
                }));
            } catch (error) {
                console.error("Error fetching token details or price:", error);
            }
        };

        fetchTokenDetailsAndPrice();
    }, [trans_token]);

    useEffect(() => {
        if (tokenData && isLPToken) {
            // Rendering the chart for LP tokens
            Highcharts.chart("lpTokenChart", {
                chart: { type: "variablepie", backgroundColor: "#000000" },
                title: {
                    text: "LP Token Distribution",
                    style: { color: "#FFFFFF" },
                },
                tooltip: {
                    headerFormat: "",
                    pointFormat:
                        '<span style="color:{point.color}">\u25CF</span> {point.name}: <b>{point.y}</b><br/>',
                    style: { color: "#FFFFFF" },
                },
                series: [
                    {
                        minPointSize: 10,
                        innerSize: "20%",
                        zMin: 0,
                        name: "tokens",
                        data: [
                            {
                                name: "Locked",
                                y: tokenData.lockedSupply,
                                color: Highcharts.getOptions().colors[1],
                            },
                            {
                                name: "Unlocked",
                                y: tokenData.unlockedSupply,
                                color: Highcharts.getOptions().colors[0],
                            },
                        ],
                    },
                ],
                credits: { enabled: false },
                legend: { itemStyle: { color: "#FFFFFF" } },
                plotOptions: {
                    series: { dataLabels: { color: "#FFFFFF" } },
                },
            });
        }
    }, [tokenData, isLPToken]);

    const fetchTokens = async () => {
        try {
            const response = await axios.get(
                `http://localhost:3001/api/tokens`
            );
            const sortedTokens = response.data.sort(
                (a, b) => Number(b.lockIndex) - Number(a.lockIndex)
            );

            setTokens(sortedTokens);

            const logs = sortedTokens.map((token) => ({
                accountLocker: token.accountLocker,
                tokenName: token.tokenName,
                amountLocked: token.amountLocked,
            }));
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
    };

    useEffect(() => {
        fetchTokens();

        const intervalId = setInterval(() => {
            fetchTokens();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);
    const handleConnectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0])); // Generate blockie
                setWeb3(new Web3(window.ethereum)); // Initialize web3 instance
            } catch (error) {
                console.error(error);
            }
        } else {
            alert("MetaMask is not installed!");
        }
    };
    const formatAddress = (address) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(
            address.length - 6
        )}`;
    };
    useEffect(() => {
        // Check if wallet is already connected
        const checkIfWalletIsConnected = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({
                    method: "eth_accounts",
                });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                    setBlockieImage(makeBlockie(accounts[0])); // Regenerate blockie
                    localStorage.setItem("ethAddress", accounts[0]); // Store address in localStorage
                } else {
                    // Check localStorage
                    const storedAddress = localStorage.getItem("ethAddress");
                    if (storedAddress) {
                        setAccount(storedAddress);
                        setIsConnected(true); // Optionally, you can set this to false to require manual reconnection
                        setBlockieImage(makeBlockie(storedAddress)); // Regenerate blockie from stored address
                    }
                }
            }
        };
        checkIfWalletIsConnected();
        // Listen for account changes
        window.ethereum?.on("accountsChanged", (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0]));
                localStorage.setItem("ethAddress", accounts[0]);
            } else {
                setIsConnected(false);
                localStorage.removeItem("ethAddress"); // Clear stored address
            }
        });
    }, []);

    useEffect(() => {
        const checkWalletConnection = async () => {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);
                const accounts = await web3Instance.eth.getAccounts();
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setIsConnected(true);
                }
            } else {
                console.log("Ethereum provider not found");
            }
        };
        checkWalletConnection();
    }, []);
    useEffect(() => {
        const fetchTokenDetails = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:3001/api/token-details/${trans_token}`
                );
                setTokenDetails(response.data);
            } catch (error) {
                console.error("Error fetching token details:", error);
            }
        };

        fetchTokenDetails();
    }, [trans_token]);
    useEffect(() => {
        const matchingToken = tokens.find(
            (token) => token.trans_token === trans_token
        );
        setSelectedToken(matchingToken);
    }, [tokens, trans_token]);

    if (!selectedToken) return <div>Loading...</div>;

    return (
        <div>
            <div>
                <nav>
                    <div className=" bg-black bg-opacity-0 main-font relative">
                        <Grid container spacing={1}>
                            <Grid xs={2}>
                                <div className="flex justify-center space-x-3 my-1">
                                    <div className="h-12 w-12 ">
                                        <img src={logoSphere} alt="logo" />
                                    </div>
                                    <div>
                                        <p className=" text-white pt-2 text-2xl">
                                            SPHERE
                                        </p>
                                    </div>
                                </div>
                            </Grid>
                            <Grid xs={10}>
                                <div className=" text-white flex justify-between mx-5">
                                    <div>
                                        <ul className="flex space-x-5 text-xl pt-4 justify-start ">
                                            <li className=" cursor-pointer">
                                                <Link to="/main">Discover</Link>
                                            </li>
                                            <li className=" cursor-pointer">
                                                My Locker
                                            </li>
                                        </ul>
                                    </div>
                                    {!isConnected ? (
                                        <div className="p-2">
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={handleConnectWallet}>
                                                Connect Wallet
                                            </Button>
                                        </div>
                                    ) : (
                                        <ul className="flex space-x-5 text-xl pt-3 justify-end ">
                                            <li>
                                                <Link to="/locker">
                                                    <Button
                                                        variant="contained"
                                                        color="secondary"
                                                        className="main-font">
                                                        LOCK TOKEN
                                                    </Button>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/unlocker">
                                                    <Button
                                                        variant="contained"
                                                        color="secondary"
                                                        className="main-font">
                                                        Unlock Token
                                                    </Button>
                                                </Link>
                                            </li>
                                            <li className=" text-sm border-1 rounded-md  bg-gray-700 border-gray-200">
                                                <div className="flex space-x-2 mx-3 my-1 ">
                                                    <div>
                                                        <img
                                                            src={blockieImage}
                                                            alt="emptylogo"
                                                            className="h-7 w-7 rounded-full"
                                                        />
                                                    </div>
                                                    <span className=" mt-1  shadow-2xl">
                                                        {formatAddress(account)}
                                                    </span>
                                                </div>
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            </Grid>
                        </Grid>
                    </div>
                </nav>
            </div>
            <div className="flex justify-center ">
                <div className="my-5">
                    <p className=" text-6xl">Token Details</p>
                </div>
            </div>
            <div className="">
                <div className="flex justify-between ">
                    <div className=" ml-[200px] ">
                        <div className="mx-4 my-4 flex space-x-3 border-b pb-4 ">
                            <img
                                src={selectedToken.logoUrl || emptyTokenImage}
                                alt={selectedToken.tokenName}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = emptyTokenImage;
                                }}
                                className="token-icon h-8 w-8 rounded-full"
                            />
                            <div className="my-auto">
                                <span className=" text-white text-2xl">
                                    {selectedToken.tokenName}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mr-[200px] my-auto">
                        <span className=" text-2xl ">
                            {formatAddress(selectedToken.contractAddress)}
                        </span>
                    </div>
                </div>

                <div className="">
                    <div className="relative">
                        {isLPToken && (
                            <div
                                id="lpTokenChart"
                                style={{
                                    height: "400px",
                                }}
                                className=" bg-black"></div>
                        )}
                    </div>
                    <div className="md:w-[1400px] mx-auto  rounded-2xl h-[400px] pt-5 ">
                        <div className="mx-auto text-center ">
                            <p className=" text-4xl mb-5">Lock Info</p>
                        </div>

                        <div className=" md:flex md:justify-center">
                            <div className=" md:w-1/3 rounded-xl  bg-gray-800 bg-opacity-30 ">
                                <div className="">
                                    <div className=" text-center my-4">
                                        <p className=" text-lg">
                                            TOKEN DETAILS
                                        </p>
                                    </div>
                                </div>
                                <div className="">
                                    <div className=" grid grid-cols-2 text-center">
                                        <div>
                                            <p className=" text-lg">
                                                TOKEN AMOUNT
                                            </p>
                                        </div>
                                        <div>
                                            <p className=" text-lg">
                                                {selectedToken.amountLocked}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className=" grid grid-cols-2 text-center">
                                    <div>
                                        <p className=" text-lg">VALUE</p>
                                    </div>
                                    <div className="mb-5">
                                        <p className="text-lg">
                                            {tokenDetails?.priceUsd &&
                                            selectedToken.amountLocked
                                                ? `$${(
                                                      parseFloat(
                                                          selectedToken.amountLocked
                                                      ) *
                                                      parseFloat(
                                                          tokenDetails.priceUsd
                                                      )
                                                  ).toFixed(8)}`
                                                : "Loading..."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TokenDetails;

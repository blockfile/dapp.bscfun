import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import logo from "../../../components/images/logo.png";
import Grid from "@mui/material/Unstable_Grid2";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import Web3 from "web3";
import makeBlockie from "ethereum-blockies-base64";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import emptyTokenLogo from "../../../components/images/empty-token.svg";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FooterNoBanner from "../../../components/footer/footernobanner";
import { Select, MenuItem, FormControl, InputLabel, Box } from "@mui/material";
function Unlocker() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState("");
    const [blockieImage, setBlockieImage] = useState("");
    const [web3, setWeb3] = useState(null);
    const [userLocks, setUserLocks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [selectedLockIndex, setSelectedLockIndex] = useState("");
    const contractAddress = "0x2f6bf5ba6b835058087e1f4d193c12658f524b43";
    const TokenLockAbi = [
        {
            inputs: [
                { internalType: "address", name: "_user", type: "address" },
                { internalType: "address", name: "_token", type: "address" },
            ],
            name: "getLockCount",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                { internalType: "address", name: "_user", type: "address" },
                { internalType: "address", name: "_token", type: "address" },
                { internalType: "uint256", name: "_index", type: "uint256" },
            ],
            name: "getLockInfo",
            outputs: [
                { internalType: "uint256", name: "amount", type: "uint256" },
                {
                    internalType: "uint256",
                    name: "unlockTime",
                    type: "uint256",
                },
                { internalType: "string", name: "tag", type: "string" },
            ],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                { internalType: "address", name: "_user", type: "address" },
            ],
            name: "getLockedTokens",
            outputs: [
                { internalType: "address[]", name: "", type: "address[]" },
            ],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                { internalType: "address", name: "_user", type: "address" },
                { internalType: "address", name: "_token", type: "address" },
            ],
            name: "isTokenLockedByUser",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                { internalType: "address", name: "_token", type: "address" },
                { internalType: "uint256", name: "_amount", type: "uint256" },
                { internalType: "uint256", name: "_duration", type: "uint256" },
                { internalType: "string", name: "_tag", type: "string" },
            ],
            name: "lockTokens",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [
                { internalType: "address", name: "", type: "address" },
                { internalType: "address", name: "", type: "address" },
                { internalType: "uint256", name: "", type: "uint256" },
            ],
            name: "tokenLocks",
            outputs: [
                { internalType: "uint256", name: "amount", type: "uint256" },
                {
                    internalType: "uint256",
                    name: "unlockTime",
                    type: "uint256",
                },
                { internalType: "string", name: "tag", type: "string" },
            ],
            stateMutability: "view",
            type: "function",
        },
        {
            inputs: [
                { internalType: "address", name: "_token", type: "address" },
                { internalType: "uint256", name: "_index", type: "uint256" },
            ],
            name: "unlockTokens",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
        {
            inputs: [{ internalType: "address", name: "", type: "address" }],
            name: "userPoints",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
        },
    ];
    const formatAddress = (address) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(
            address.length - 6
        )}`;
    };

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
    async function fetchTokenData(tokenAddress) {
        try {
            const response = await axios.get(
                `http://localhost:3001/api/get-token-data/${tokenAddress}`
            );
            let logoUrl;
            if (response.data && response.data.data) {
                // Construct the logo URL directly from the token address
                logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${tokenAddress}/logo.png`;
                return {
                    name: response.data.data.name || "Unknown Token",
                    logo: logoUrl,
                };
            } else {
                return { name: "Unknown Token", logo: emptyTokenLogo };
            }
        } catch (error) {
            console.error(
                `Error fetching data for token at address ${tokenAddress}:`,
                error
            );
            return { name: "Unknown Token", logo: emptyTokenLogo };
        }
    }

    const fetchUserLocks = async () => {
        if (!account || !web3) return;

        const lockContract = new web3.eth.Contract(
            TokenLockAbi,
            contractAddress
        );

        try {
            const lockedTokens = await lockContract.methods
                .getLockedTokens(account)
                .call();
            const allLocks = [];

            for (const tokenAddress of lockedTokens) {
                const lockCount = await lockContract.methods
                    .getLockCount(account, tokenAddress)
                    .call();

                for (let i = 0; i < lockCount; i++) {
                    const lockInfo = await lockContract.methods
                        .getLockInfo(account, tokenAddress, i)
                        .call();

                    if (lockInfo.amount > 0) {
                        const tokenData = await fetchTokenData(tokenAddress);

                        if (tokenData && tokenData.name) {
                            allLocks.push({
                                tokenAddress,
                                tokenName: tokenData.name,
                                tokenLogo: tokenData.logo,
                                index: i,
                                amount: lockInfo.amount,
                                unlockTime: lockInfo.unlockTime,
                            });
                        } else {
                            console.log(
                                `Data for token at address ${tokenAddress} is undefined`
                            );
                        }
                    }
                }
            }

            setUserLocks(allLocks);
        } catch (error) {
            console.error("Error fetching user locks:", error);
        }
    };
    useEffect(() => {
        fetchUserLocks();
    }, [account, web3]);

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
    const handleUnlockTokens = async () => {
        if (!selectedLockIndex) {
            alert("Please select a token lock to unlock.");
            return;
        }

        try {
            const [tokenAddress, index] = selectedLockIndex.split("-");
            const lockContract = new web3.eth.Contract(
                TokenLockAbi,
                contractAddress
            );

            const lockInfo = await lockContract.methods
                .getLockInfo(account, tokenAddress, index)
                .call();

            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime < parseInt(lockInfo.unlockTime)) {
                const remainingTime =
                    parseInt(lockInfo.unlockTime) - currentTime;
                const formattedTime = formatTime(remainingTime);
                setModalMessage(
                    `This Token Cannot be Unlocked Yet. Please wait ${formattedTime} to unlock.`
                );
                setIsModalOpen(true);
                return;
            }

            await lockContract.methods
                .unlockTokens(tokenAddress, index)
                .send({ from: account });

            console.log("Tokens unlocked");
            fetchUserLocks(); // Refresh the locks list

            const unlockData = {
                accountLocker: account,
                tokenAddress: tokenAddress,
                lockIndex: index,
                status: "Unlocked",
                unlockedDate: new Date(),
            };

            // Send unlock data to the server for updating the status
            try {
                const response = await axios.post(
                    "http://localhost:3001/unlock-token",
                    unlockData
                );
                console.log("Token unlock data updated:", response.data);
            } catch (error) {
                console.error("Error updating token unlock data:", error);
            }
        } catch (error) {
            console.error("Error unlocking tokens:", error);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours} hours, ${minutes} minutes, and ${secs} seconds`;
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    return (
        <div className="bg h-full">
            <div>
                <nav>
                    <div className=" bg-black bg-opacity-0 main-font relative">
                        <Grid container spacing={1}>
                            <Grid xs={2}>
                                <div className="flex justify-center space-x-3 my-1">
                                    <div className="h-12 w-12 ">
                                        <img src={logo} alt="logo" />
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
            <Container fixed className="my-10">
                <div className=" flex justify-center">
                    <div className=" bg-black bg-opacity-0 w-1/2  text-center rounded-xl">
                        <div className="my-5">
                            <span className=" text-4xl">TOKEN UNLOCKER</span>
                        </div>
                        <div className=" text-left mx-4">
                            <span className=" text-lg">SELECT TOKEN:</span>
                            <div className="my-8">
                                <FormControl fullWidth>
                                    <InputLabel
                                        id="demo-select-small-label"
                                        style={{ color: "gray" }}>
                                        PICK YOUR TOKEN
                                    </InputLabel>
                                    <Select
                                        labelId="token-select-label"
                                        value={selectedLockIndex}
                                        label="Select Lock to Unlock"
                                        IconComponent={() => (
                                            <ArrowDropDownIcon
                                                style={{ color: "white" }}
                                            />
                                        )}
                                        style={{
                                            color: "white",
                                            border: "1px solid white",
                                            borderRadius: 4,
                                            backgroundColor: "transparent",
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    backgroundColor: "black", // Set the dropdown background color to black
                                                },
                                            },
                                        }}
                                        onChange={(e) =>
                                            setSelectedLockIndex(e.target.value)
                                        }>
                                        <MenuItem
                                            value=""
                                            style={{
                                                color: "white",
                                                fontSize: "18px",
                                            }}>
                                            <em>None</em>
                                        </MenuItem>
                                        {userLocks.map((lock, index) => (
                                            <MenuItem
                                                key={index}
                                                value={`${lock.tokenAddress}-${lock.index}`}
                                                style={{ color: "white" }}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}>
                                                    <img
                                                        src={
                                                            lock.tokenLogo ||
                                                            emptyTokenLogo
                                                        }
                                                        alt={`${lock.tokenName} logo`}
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                            marginRight: 10,
                                                        }}
                                                        onError={(e) => {
                                                            if (
                                                                e.target.src !==
                                                                emptyTokenLogo
                                                            ) {
                                                                e.target.src =
                                                                    emptyTokenLogo;
                                                            }
                                                        }}
                                                    />
                                                    {lock.tokenName} - Amount:{" "}
                                                    {web3.utils.fromWei(
                                                        lock.amount,
                                                        "ether"
                                                    )}{" "}
                                                    - Contract:{" "}
                                                    {lock.tokenAddress}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className=" flex justify-center my-5">
                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={handleUnlockTokens}>
                                        Unlock Tokens
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
            <div className=" mt-[438px] relative">
                <FooterNoBanner />
            </div>
            <Dialog
                open={isModalOpen}
                onClose={handleCloseModal}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">
                    {"Unlock Token"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {modalMessage}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseModal}
                        color="primary"
                        autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Unlocker;

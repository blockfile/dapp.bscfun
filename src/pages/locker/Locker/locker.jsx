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
import TextField from "@mui/material/TextField";
import BigNumber from "bignumber.js";

import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import FooterNoBanner from "../../../components/footer/footernobanner";
function Locker() {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState("");
    const [blockieImage, setBlockieImage] = useState("");
    const [tokens, setTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState("");
    const [web3, setWeb3] = useState(null);
    const [lockAmount, setLockAmount] = useState("");
    const [lockMinutes, setLockMinutes] = useState("");
    const [lockDays, setLockDays] = useState("");
    const [lockMonths, setLockMonths] = useState("");
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

    const fetchTokens = async (walletAddress) => {
        try {
            const response = await axios.get(
                `http://localhost:3001/tokens?address=${walletAddress}`
            );
            const formattedTokens = response.data.map((token) => {
                // Assuming token.balance is in Wei or a similar smallest unit
                const balanceBN = new BigNumber(token.balance);
                const readableBalance = balanceBN
                    .dividedBy(new BigNumber(10).pow(18))
                    .toFixed(); // Adjust 18 to the token's actual decimals
                return {
                    ...token,
                    balance: readableBalance,
                };
            });
            setTokens(formattedTokens);
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
    };
    useEffect(() => {
        if (account) {
            fetchTokens(account);
        }
    }, [account]);

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
                    setBlockieImage(makeBlockie(accounts[0]));
                    localStorage.setItem("ethAddress", accounts[0]);
                } else {
                    // Check localStorage
                    const storedAddress = localStorage.getItem("ethAddress");
                    if (storedAddress) {
                        setAccount(storedAddress);
                        setIsConnected(true);
                        setBlockieImage(makeBlockie(storedAddress));
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
                localStorage.removeItem("ethAddress");
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
                    fetchTokens(accounts[0]);
                }
            } else {
                console.log("Ethereum provider not found");
            }
        };
        checkWalletConnection();
    }, []);

    const fetchTokenSymbol = async (tokenAddress) => {
        const lockContract = new web3.eth.Contract(
            TokenLockAbi,
            contractAddress
        );
        try {
            const symbol = await lockContract.methods
                .getTokenSymbol(tokenAddress)
                .call();
            return symbol;
        } catch (error) {
            console.error("Error fetching token symbol:", error);
            return "Unknown";
        }
    };
    const fetchUserPoints = async () => {
        if (web3 && account) {
            const lockContract = new web3.eth.Contract(
                TokenLockAbi,
                contractAddress
            );
            try {
                const points = await lockContract.methods
                    .userPoints(account)
                    .call();
                return points;
            } catch (error) {
                console.error("Error fetching user points:", error);
                return 0;
            }
        }
    };

    const handleLockTokens = async () => {
        // Check if all required fields are filled
        if (!web3 || !lockAmount || !selectedToken) {
            console.log("All fields are required");
            return;
        }

        // Convert lock duration to seconds
        const durationInSeconds =
            (parseInt(lockMinutes) || 0) * 60 +
            (parseInt(lockDays) || 0) * 24 * 60 * 60 +
            (parseInt(lockMonths) || 0) * 30 * 24 * 60 * 60;

        // Convert the amount to lock to the appropriate format (e.g., Wei)
        const amountToLock = web3.utils.toWei(lockAmount, "ether").toString();

        try {
            // Interact with the token contract to approve the lock
            const tokenContract = new web3.eth.Contract(
                [
                    {
                        constant: false,
                        inputs: [
                            { name: "_spender", type: "address" },
                            { name: "_value", type: "uint256" },
                        ],
                        name: "approve",
                        outputs: [{ name: "", type: "bool" }],
                        type: "function",
                    },
                ],
                selectedToken
            );

            await tokenContract.methods
                .approve(contractAddress, amountToLock)
                .send({ from: account });

            // Interact with your lock contract
            const lockContract = new web3.eth.Contract(
                TokenLockAbi,
                contractAddress
            );
            await lockContract.methods
                .lockTokens(selectedToken, amountToLock, durationInSeconds)
                .send({ from: account });
            const lockCount = await lockContract.methods
                .getLockCount(account, selectedToken)
                .call();
            const lockIndex = Number(lockCount) - 1;
            const tokenSymbol = await fetchTokenSymbol(selectedToken);
            const points = await fetchUserPoints();

            console.log("Tokens locked");

            // Prepare data for saving
            const tokenData = {
                tokenName: tokens.find(
                    (token) => token.contractAddress === selectedToken
                ).tokenName,
                contractAddress: selectedToken,
                amountLocked: lockAmount,
                lockDuration: {
                    minutes: lockMinutes,
                    days: lockDays,
                    months: lockMonths,
                },
                tokenSymbol,

                date: new Date(),
                accountLocker: account,
                trans_token: generateTransToken(),
                status: "Locked",
                lockIndex: lockIndex,
            };

            // Send token lock data to the server
            const response = await axios.post(
                "http://localhost:3001/lock-token",
                tokenData
            );
            console.log("Token lock data saved:", response.data);
        } catch (error) {
            console.error("Error in locking tokens or saving data:", error);
        }
    };

    // Function to generate a unique transaction token
    const generateTransToken = () => {
        return Math.random().toString(36).substr(2, 9);
    };
    // Example of logging the data before sending

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
            <Container fixed className="my-10 ">
                <div className=" flex justify-center  ">
                    <div className=" bg-black bg-opacity-0 w-1/2  text-center rounded-xl ">
                        <div className="my-5">
                            <span className=" text-4xl">TOKEN LOCKER</span>
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
                                        value={selectedToken}
                                        label="Select Token"
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
                                                    backgroundColor: "black",
                                                },
                                            },
                                        }}
                                        onChange={(e) =>
                                            setSelectedToken(e.target.value)
                                        }>
                                        <MenuItem
                                            value=""
                                            style={{
                                                color: "white",
                                                fontSize: "18px",
                                            }}>
                                            <em>None</em>
                                        </MenuItem>
                                        {tokens.map((token, index) => (
                                            <MenuItem
                                                key={index}
                                                value={token.contractAddress}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "flex-start",
                                                }}>
                                                <div className=" flex">
                                                    <div>
                                                        <img
                                                            src={token.logoUrl}
                                                            onError={(e) => {
                                                                e.target.onerror =
                                                                    null;
                                                                e.target.src =
                                                                    "path_to_fallback_image";
                                                            }}
                                                            alt={
                                                                token.tokenName
                                                            }
                                                            style={{
                                                                width: "30px",
                                                                height: "30px",
                                                                marginRight:
                                                                    "10px",
                                                            }}
                                                            crossOrigin="anonymous"
                                                        />
                                                    </div>
                                                    <div className="  text-white text-xl my-auto">
                                                        {token.tokenName} (
                                                        {parseInt(
                                                            token.balance,
                                                            10
                                                        )}
                                                        )
                                                    </div>
                                                </div>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </div>
                            <div>
                                <div className=" text-left my-5">
                                    <span className=" text-lg">
                                        AMOUNT TO LOCK:
                                    </span>
                                </div>
                                <div>
                                    <div>
                                        <TextField
                                            id="outlined-password-input"
                                            label="INPUT AMOUNT"
                                            value={lockAmount}
                                            onChange={(e) =>
                                                setLockAmount(e.target.value)
                                            }
                                            InputLabelProps={{
                                                style: { color: "gray" },
                                            }}
                                            InputProps={{
                                                style: { color: "white" },
                                            }}
                                            style={{
                                                color: "white",
                                                border: "1px solid white",
                                                borderRadius: 4,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className=" text-left my-5">
                                    <span className=" text-lg">DURATION:</span>
                                </div>
                                <div className=" grid-cols-4 grid space-x-2">
                                    <div>
                                        <TextField
                                            id="outlined-password-input"
                                            label="YEAR"
                                            InputLabelProps={{
                                                style: { color: "gray" },
                                            }}
                                            InputProps={{
                                                style: { color: "white" },
                                            }}
                                            style={{
                                                color: "white",
                                                border: "1px solid white",
                                                borderRadius: 4,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <TextField
                                            id="outlined-password-input"
                                            label="MONTHS"
                                            value={lockMonths}
                                            onChange={(e) =>
                                                setLockMonths(e.target.value)
                                            }
                                            InputLabelProps={{
                                                style: { color: "gray" },
                                            }}
                                            InputProps={{
                                                style: { color: "white" },
                                            }}
                                            style={{
                                                color: "white",
                                                border: "1px solid white",
                                                borderRadius: 4,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <TextField
                                            id="outlined-password-input"
                                            label="DAYS"
                                            value={lockDays}
                                            onChange={(e) =>
                                                setLockDays(e.target.value)
                                            }
                                            InputLabelProps={{
                                                style: { color: "gray" },
                                            }}
                                            InputProps={{
                                                style: { color: "white" },
                                            }}
                                            style={{
                                                color: "white",
                                                border: "1px solid white",
                                                borderRadius: 4,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <TextField
                                            id="outlined-password-input"
                                            label="MINUTES"
                                            value={lockMinutes}
                                            onChange={(e) =>
                                                setLockMinutes(e.target.value)
                                            }
                                            InputLabelProps={{
                                                style: { color: "gray" },
                                            }}
                                            InputProps={{
                                                style: { color: "white" },
                                            }}
                                            style={{
                                                color: "white",
                                                border: "1px solid white",
                                                borderRadius: 4,
                                                backgroundColor: "transparent",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className=" flex justify-center my-5">
                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={handleLockTokens}>
                                        Lock Tokens
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
            <div className=" mt-[230px] relative">
                <FooterNoBanner />
            </div>
        </div>
    );
}

export default Locker;

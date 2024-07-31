import React, { useState, useEffect } from "react";
import makeBlockie from "ethereum-blockies-base64";
import Grid from "@mui/material/Unstable_Grid2";
import Web3 from "web3";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import "./main.css";
import { GrOverview } from "react-icons/gr";
import logoSphere from "../../../components/images/logo.png";
import axios from "axios";
import emptyTokenImage from "../../../components/images/empty-token.svg";
import FooterNoBannerMain from "../../../components/footer/footernobannermain";

function Main() {
    const [account, setAccount] = useState("");
    const [blockieImage, setBlockieImage] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [web3, setWeb3] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [displayedTokens, setDisplayedTokens] = useState(9);
    const [displayedRecentLocks, setDisplayedRecentLocks] = useState(6); // Initially show 5 items
    const [lockLogs, setLockLogs] = useState([]);
    const [totalLocked, setTotalLocked] = useState(0);
    const loadMoreRecentLocks = () => {
        setDisplayedRecentLocks((prevDisplayed) => prevDisplayed + 5); // Load 5 more items
    };
    //scrolling
    function debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this,
                args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    const loadMoreTokens = () => {
        setDisplayedTokens((prevDisplayedTokens) => prevDisplayedTokens + 9); // Load 6 more tokens
    };

    useEffect(() => {
        const handleScroll = debounce(() => {
            if (
                window.innerHeight + document.documentElement.scrollTop <
                document.documentElement.offsetHeight - 100
            )
                return;
            loadMoreTokens();
        }, 100); // Adjust debounce time as needed

        // Add event listener
        window.addEventListener("scroll", handleScroll);

        // Clean up the event listener
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    //scrolling
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

            setLockLogs(logs);
            setTotalLocked(logs.length); // Or calculate the sum if needed
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
    };

    const LockLog = ({ log }) => {
        return (
            <div className="log-entry ">
                <p className="text-lg">
                    {log.accountLocker} locked {log.tokenName} with a quantity
                    of {log.amountLocked} tokens.
                </p>
            </div>
        );
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
    const handleScroll = (e) => {
        const bottom =
            e.target.scrollHeight - e.target.scrollTop ===
            e.target.clientHeight;
        if (bottom) {
            loadMoreRecentLocks();
        }
    };
    return (
        <div className="">
            <div className=" bg  h-full w-full fixed ">
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
                                            BSC PUMP
                                        </p>
                                    </div>
                                </div>
                            </Grid>
                            <Grid xs={10}>
                                <div className=" text-white flex justify-between mx-5">
                                    <div>
                                        <ul className="flex space-x-5 text-xl pt-4 justify-start ">
                                            <li className=" cursor-pointer">
                                                My Token
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
                                                        CREATE TOKEN
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
                <div className=" w-10/12 left-0 right-0 mx-auto my-8 ">
                    <Grid container spacing={2}>
                        <Grid xs={4}>
                            <div>
                                <div className="mb-5  ">
                                    <span className=" text-2xl ">
                                        Recent Created Token
                                    </span>
                                </div>
                                <div>
                                    <div className="flex justify-evenly">
                                        <div>
                                            <span className=" text-2xl text-white">
                                                TOKEN NAME
                                            </span>
                                        </div>
                                        <div>
                                            <span className=" text-2xl text-white">
                                                CREATOR ADDRESS
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-evenly shadow-2xl rounded-2xl shadow-slate-800  ">
                                    <div
                                        className="my-5 px-10 py-4 overflow-auto hide-scrollbar h-[400px] "
                                        onScroll={handleScroll}>
                                        {tokens
                                            .slice(0, displayedRecentLocks)
                                            .map((token, index) => (
                                                <div className=" shadow-xl  rounded-2xl px-5 pb-5 hover:bg-slate-900 transition-colors duration-300 ease-in-out ">
                                                    <div
                                                        key={index}
                                                        className="flex space-x-1 my-2">
                                                        <img
                                                            src={token.logoUrl}
                                                            alt={
                                                                token.tokenName
                                                            }
                                                            onLoad={(e) => {
                                                                console.log(
                                                                    `Image loaded successfully from ${e.target.src}`
                                                                );
                                                            }}
                                                            onError={(e) => {
                                                                console.error(
                                                                    `Failed to load image at ${e.target.src}, switching to fallback image.`
                                                                );
                                                                e.target.onerror =
                                                                    null; // Prevents future invocations
                                                                e.target.src =
                                                                    emptyTokenImage; // Fallback image path
                                                            }}
                                                            className="token-icon h-8 w-8 rounded-full mt-8"
                                                        />
                                                        <div className=" flex w-full space-x-48 border-2 border-white space-y-10 ">
                                                            <div className=" w-full mt-9">
                                                                <span className="my-auto text-white">
                                                                    {
                                                                        token.tokenName
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className=" text-justify">
                                                                <div className="my-auto">
                                                                    <span className=" text-justify">
                                                                        {
                                                                            token.amountLocked
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </Grid>
                        <Grid xs={8} className="flex space-x-2 ">
                            <div className="flex flex-col text-black rounded-lg w-full shadow-2xl  shadow-slate-800 mt-5 h-[480px]">
                                <div className="w-full text-center">
                                    <div className="my-10 grid">
                                        <span className="text-white text-5xl">
                                            TOKEN CREATION LOGS
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-auto hide-scrollbar rounded-xl">
                                    {/* Log Entries */}
                                    <div className="log-entries">
                                        {lockLogs.map((log, index) => (
                                            <LockLog key={index} log={log} />
                                        ))}
                                    </div>
                                    {/* Total Locked Tokens */}
                                </div>
                                <div className="total-locked">
                                    <p className=" text-2xl text-slate-400">
                                        TOTAL TOKEN CREATED: {totalLocked}
                                    </p>
                                </div>
                            </div>
                        </Grid>
                    </Grid>

                    <div>
                        <div className="  my-5 rounded-lg text-white ">
                            <div className="py-4 px-4 text-2xl">
                                <div> Tokens List</div>
                            </div>
                            <Grid container>
                                {tokens
                                    .slice(0, displayedTokens)
                                    .map((token, index) => (
                                        <Grid xs={4} key={index}>
                                            <div className="py-4 px-4 rounded-xl border-2 shadow-inner shadow-slate-800 border-white mx-4 my-3 transition-colors duration-300 ease-in-out hover:bg-slate-900">
                                                <div className="rounded-lg border  ">
                                                    <div className="mx-4 my-4 flex space-x-3 border-b pb-4 ">
                                                        <img
                                                            src={token.logoUrl}
                                                            alt={
                                                                token.tokenName
                                                            }
                                                            onLoad={(e) => {
                                                                console.log(
                                                                    `Image loaded successfully from ${e.target.src}`
                                                                );
                                                            }}
                                                            onError={(e) => {
                                                                console.error(
                                                                    `Failed to load image at ${e.target.src}, switching to fallback image.`
                                                                );
                                                                e.target.onerror =
                                                                    null; // Prevents future invocations
                                                                e.target.src =
                                                                    emptyTokenImage; // Fallback image path
                                                            }}
                                                            className="token-icon h-8 w-8 rounded-full"
                                                        />
                                                        <div className="my-auto">
                                                            <span className=" text-white text-2xl">
                                                                {
                                                                    token.tokenName
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mx-4 ">
                                                        <div>
                                                            <p className="text-white text-xl">
                                                                TOKEN LOCKED
                                                            </p>
                                                            <div className="flex justify-between  ">
                                                                <p className="text-white text-xl">
                                                                    TOKEN
                                                                    AMOUNT:
                                                                </p>
                                                                <p className=" text-white text-xl">
                                                                    {
                                                                        token.amountLocked
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="flex justify-end my-5">
                                                                <Button
                                                                    variant="outlined"
                                                                    startIcon={
                                                                        <GrOverview />
                                                                    }>
                                                                    <Link
                                                                        to={`/main/${token.trans_token}`}
                                                                        style={{
                                                                            textDecoration:
                                                                                "none",
                                                                            color: "inherit",
                                                                        }}>
                                                                        View
                                                                        Details
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                            {/* You can add more details here as per your schema */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Grid>
                                    ))}
                            </Grid>
                        </div>
                    </div>
                </div>
                <FooterNoBannerMain />
            </div>
        </div>
    );
}

export default Main;

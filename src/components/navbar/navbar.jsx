// Navbar.js
import React, { useState, useEffect } from "react";
import "./navbar.css";
import logo from "../images/logo.png";
import Sidebar from "../sidebar/sidebar";
import Footer from "../footer/footer";
import Grid from "@mui/material/Unstable_Grid2";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import makeBlockie from "ethereum-blockies-base64";
function Navbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const formatAddress = (address) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(
            address.length - 6
        )}`;
    };
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState("");
    const [userData, setUserData] = useState(null);
    const [blockieImage, setBlockieImage] = useState("");
    const handleConnectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setIsConnected(true);
                setBlockieImage(makeBlockie(accounts[0])); // Generate blockie
            } catch (error) {
                console.error(error);
            }
        } else {
            alert("MetaMask is not installed!");
        }
    };

    const fetchUserData = async (address) => {
        try {
            const response = await axios.get(
                `[Your Backend URL]/api/path?address=${address}`
            );
            setUserData(response.data);
        } catch (error) {
            console.error("Error fetching user data:", error);
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
    return (
        <div className="">
            <nav className="">
                <div className=" main-font relative ">
                    <Grid container>
                        <Grid xs={2}>
                            <div className="flex justify-center space-x-3 my-1 absolute">
                                <div className=" h-20 w-20 ml-5 ">
                                    <img src={logo} alt="logo" />
                                </div>
                                <div>
                                    <p className=" text-white pt-4 text-5xl">
                                        SPHERE
                                    </p>
                                </div>
                            </div>
                        </Grid>
                        <Grid xs={10}>
                            <div className=" text-white flex justify-end mx-14  ">
                                {!isConnected ? (
                                    <div className="p-2 hidden lg:block">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            onClick={handleConnectWallet}
                                            sx={{
                                                backgroundColor: "white",
                                                color: "black",
                                                fontSize: "medium",
                                                padding: "10px 20px",
                                                borderRadius: "30px",
                                                "&:hover": {
                                                    backgroundColor: "black",
                                                    color: "white",
                                                },
                                            }}>
                                            Connect Wallet
                                        </Button>
                                    </div>
                                ) : (
                                    <ul className="flex space-x-5 text-xl mt-4 justify-end  ">
                                        <li className=" text-sm border-1 rounded-3xl bg-white text-black border-gray-200 w-[250px] h-[40px] hidden lg:block  ">
                                            <div className="flex space-x-2 ml-7 my-2  ">
                                                <div>
                                                    <img
                                                        src={blockieImage}
                                                        alt="emptylogo"
                                                        className="h-10 w-10 rounded-full"
                                                    />
                                                </div>
                                                <span className="  text-3xl shadow-2xl mt-1">
                                                    {formatAddress(account)}
                                                </span>
                                            </div>
                                        </li>
                                    </ul>
                                )}
                                <div className="profile-area">
                                    <div className="mt-8">
                                        <button
                                            id="menu-btn"
                                            onClick={() =>
                                                setIsSidebarOpen(!isSidebarOpen)
                                            }
                                            className="md:hidden ...">
                                            <span className="material-symbols-sharp">
                                                menu
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Grid>
                    </Grid>
                </div>
            </nav>
            <Sidebar
                isOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <Footer />
        </div>
    );
}

export default Navbar;

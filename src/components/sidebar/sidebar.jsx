import React, { useEffect, useState } from "react";
import "./sidebar.css";
import Dashboard from "../../pages/dashboard/dashboard";
import axios from "axios";
import { Link } from "react-router-dom";
function Sidebar() {
    const [trending, setTrending] = useState([]);

    // Function to fetch trending coins
    const fetchTrendingCoins = () => {
        const storedTrending = localStorage.getItem("trendingCoins");
        if (storedTrending) {
            setTrending(JSON.parse(storedTrending));
        } else {
            axios
                .get(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
                )
                .then((response) => {
                    const btcPriceInUSD = response.data.bitcoin.usd;
                    axios
                        .get("https://dapp.sphereprotocol.com/api/trending")
                        .then((response) => {
                            // Modify here: Slice the response array to include only the first 13 elements
                            const updatedCoins = response.data.coins
                                .slice(0, 13)
                                .map((coin) => {
                                    coin.priceInUSD =
                                        coin.item.price_btc * btcPriceInUSD;
                                    return coin;
                                });
                            setTrending(updatedCoins);
                            localStorage.setItem(
                                "trendingCoins",
                                JSON.stringify(updatedCoins)
                            );
                        })
                        .catch((error) =>
                            console.error(
                                "Error fetching trending coins:",
                                error
                            )
                        );
                })
                .catch((error) =>
                    console.error("Error fetching BTC price:", error)
                );
        }
    };

    useEffect(() => {
        fetchTrendingCoins();
        const interval = setInterval(() => {
            localStorage.removeItem("trendingCoins"); // Clear stored data before fetching new
            fetchTrendingCoins();
        }, 240000); // Update every 2 minutes

        return () => clearInterval(interval);
    }, []);

    // Handling sidebar UI
    useEffect(() => {
        const menuBtn = document.querySelector("#menu-btn");
        const closeBtn = document.querySelector("#close-btn");
        const sidebar = document.querySelector("aside");

        const handleResize = () => {
            if (window.innerWidth > 1024) {
                sidebar.style.display = "";
            }
        };

        if (menuBtn && closeBtn && sidebar) {
            menuBtn.addEventListener("click", () => {
                sidebar.style.display = "block";
            });

            closeBtn.addEventListener("click", () => {
                sidebar.style.display = "none";
            });

            window.addEventListener("resize", handleResize);
        }

        return () => {
            if (menuBtn && closeBtn) {
                menuBtn.removeEventListener("click", () => {
                    sidebar.style.display = "block";
                });

                closeBtn.removeEventListener("click", () => {
                    sidebar.style.display = "none";
                });
            }
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div>
            <main>
                <aside>
                    <button id="close-btn">
                        <span className="material-symbols-sharp">close</span>
                    </button>
                    <div className="sidebar">
                        {/* Sidebar links */}
                        <Link className="active" to="/dashboard">
                            <span className="material-symbols-sharp">
                                dashboard
                            </span>
                            <h4>Dashboard</h4>
                        </Link>
                        <a href="/dexlimit">
                            <span className="material-symbols-sharp">
                                currency_exchange
                            </span>
                            <h4>DEX Limit</h4>
                        </a>
                        <a href="/swap">
                            <span className="material-symbols-outlined">
                                swap_horizontal_circle
                            </span>
                            <h4>Swap</h4>
                        </a>
                        <a href="/rugcheker">
                            <span class="material-symbols-outlined">
                                search_check
                            </span>
                            <h4>Rug checker</h4>
                        </a>
                        <a href="/wallet">
                            <span className="material-symbols-sharp">
                                account_balance_wallet
                            </span>
                            <h4>Wallet</h4>
                        </a>
                        <Link to="/main">
                            <span class="material-symbols-outlined">lock</span>
                            <h4>Locker</h4>
                        </Link>
                        <a href="/scan">
                            <span class="material-symbols-outlined">
                                monitoring
                            </span>
                            <h4>SphereScan</h4>
                        </a>
                    </div>
                </aside>
                <Dashboard />
                <section className="right">
                    <div className="investments">
                        <div className="header">
                            <h2>Coin Trending</h2>
                        </div>
                        {trending.map((coin, index) => (
                            <div className="investment" key={index}>
                                <img
                                    src={coin.item.small}
                                    alt={coin.item.name}
                                />
                                <h4>{coin.item.name}</h4>
                                <div className="bonds">
                                    <p>{coin.item.symbol}</p>
                                    <small className="text-muted">Symbol</small>
                                </div>
                                <div className="amount">
                                    <p>${coin.priceInUSD.toFixed(8)}</p>
                                    <small className="danger"></small>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Sidebar;

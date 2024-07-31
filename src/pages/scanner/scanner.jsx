import React, { useState, useEffect, useRef } from "react";
import "./scanner.css";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Highcharts from "highcharts";
import variablePie from "highcharts/modules/variable-pie.js";
import HC_accessibility from "highcharts/modules/accessibility";
import { IoArrowBackCircle } from "react-icons/io5";
HC_accessibility(Highcharts);
variablePie(Highcharts);
function Scanner() {
    const [contractAddress, setContractAddress] = useState("");
    const [verificationStatus, setVerificationStatus] = useState("");
    const [contractAnalysis, setContractAnalysis] = useState([]);
    const [honeypotAnalysis, setHoneypotAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [network, setNetwork] = useState("BSC");
    const [tokenDetails, setTokenDetails] = useState(null);
    const [hasInput, setHasInput] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);
    const chartContainerRef = useRef(null);
    const chartInstance = useRef(null);

    const initializeChart = (score) => {
        if (chartContainerRef.current) {
            // Destroy the existing chart instance if it exists and is a valid chart
            if (
                chartInstance.current &&
                chartInstance.current.forExport !== undefined
            ) {
                chartInstance.current.destroy();
            }

            chartInstance.current = Highcharts.chart(
                chartContainerRef.current,
                {
                    chart: {
                        type: "variablepie",
                        backgroundColor: "#000000",
                    },
                    title: {
                        text: "Contract Score Analysis",
                        align: "center",
                        style: {
                            color: "#FFFFFF", // White color
                            fontSize: "20px", // Larger font size
                            fontFamily: '"Press Start 2P", sans-serif', // Example font family
                        },
                    },
                    tooltip: {
                        headerFormat: "",
                        pointFormat:
                            '<span style="color:{point.color}">\u25CF</span> <b> {point.name}</b><br/>' +
                            "Percentage: <b>{point.y}%</b><br/>" +
                            "Absolute Value (for visualization): <b>{point.z}</b><br/>",
                    },
                    series: [
                        {
                            minPointSize: 10,
                            innerSize: "20%",
                            zMin: 0,
                            name: "score",
                            borderRadius: 5,
                            data: [
                                {
                                    name: "Positive Score",
                                    y: score,
                                    z: score,
                                },
                                {
                                    name: "Negative Score",
                                    y: 100 - score,
                                    z: 100 - score,
                                },
                            ],
                            colors: ["#50B432", "#ED561B"],
                        },
                    ],
                }
            );
        }
    };

    useEffect(() => {
        const calculateScore = () => {
            let checkCount = 0;
            let crossWarningCount = 0;

            /* eslint-disable eqeqeq */
            if (tokenDetails) {
                if (tokenDetails.is_mintable == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }

                if (tokenDetails.can_take_back_ownership == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (tokenDetails.owner_change_balance == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (tokenDetails.hidden_owner == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (tokenDetails.slippage_modifiable == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (tokenDetails.selfdestruct == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (tokenDetails.is_anti_whale == 1) {
                    checkCount++;
                } else {
                    crossWarningCount++;
                }
                if (tokenDetails.transfer_pausable == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (tokenDetails.can_take_back_ownership == 1) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }
                if (
                    tokenDetails.owner_balance / tokenDetails.total_supply >
                    0.05
                ) {
                    crossWarningCount++;
                } else {
                    checkCount++;
                }

                console.log("check", checkCount);
                console.log("cross", crossWarningCount);
            }

            const totalChecks = checkCount + crossWarningCount;
            const positivePercentage = (checkCount / totalChecks) * 100;
            return positivePercentage;
        };
        if (tokenDetails) {
            const score = calculateScore();

            initializeChart(score);
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [tokenDetails]);

    const getApiEndpoint = (network, contractAddress, type) => {
        const apiKey =
            network === "Ethereum"
                ? "FUMHTQE96FPWIW79ZJFCIXFX5BPCGNQC7T"
                : "JUDPV627WC6YPRF9PJ992PQ4MMAIZVCDVV";
        const baseUrl =
            network === "Ethereum"
                ? "https://api.etherscan.io/api"
                : "https://api.bscscan.com/api";

        switch (type) {
            case "abi":
                return `${baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;
            case "tx":
                return `${baseUrl}?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;
            case "source":
                return `${baseUrl}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`;
            default:
                return "";
        }
    };

    const scanContract = async () => {
        setIsLoading(true);
        setHasScanned(true);
        if (!contractAddress) {
            alert("Please enter a contract address.");
            setIsLoading(false);
            return;
        }
        const tokenSecurityData = await fetchTokenSecurityData(
            contractAddress,
            network
        );

        if (tokenSecurityData) {
        }

        const abiUrl = getApiEndpoint(network, contractAddress, "abi");

        const sourceUrl = getApiEndpoint(network, contractAddress, "source");

        try {
            const abiResponse = await fetch(abiUrl);
            const abiData = await abiResponse.json();

            if (abiData.status !== "1") {
                setVerificationStatus("NOT A VALID CONTRACT");
                setContractAnalysis([]);
                setIsLoading(false);
                setHoneypotAnalysis(null);
                return;
            }

            setVerificationStatus("This contract is verified.");

            const sourceResponse = await fetch(sourceUrl);
            const sourceData = await sourceResponse.json();

            let analysisLines = [];

            if (sourceData.status === "1" && sourceData.result.length > 0) {
                analysisLines.push({
                    text: "CONTRACT CHECKER:",
                    className: "font-title",
                });
            } else {
                setContractAnalysis([
                    "Unable to fetch or analyze contract source code.",
                ]);
                setIsLoading(false);
                setHasScanned(true);
                return;
            }

            setContractAnalysis(analysisLines);
        } catch (error) {
            console.error("Error in scanning contract:", error);
            setVerificationStatus("Error during scanning.");
            setContractAnalysis(["Error during source code analysis."]);
            setHoneypotAnalysis(null);
        } finally {
            setIsLoading(false);
        }

        await checkHoneypot();
    };
    // const truncateAddress = (address) => {
    //     return `${address.substring(0, 6)}...${address.substring(
    //         address.length - 4
    //     )}`;
    // };

    // const formatBalance = (balance) => {
    //     return parseInt(balance).toLocaleString(); // Converts to a whole number and formats with commas
    // };

    // const formatPercentage = (percent) => {
    //     return (parseFloat(percent) * 100).toFixed(2); // Converts to a percentage and fixes to 2 decimal places
    // };

    const fetchTokenSecurityData = async (contractAddress, network) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `https://dapp.sphereprotocol.com/token-security?network=${network}&contractAddresses=${contractAddress}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.result || !data.result[contractAddress.toLowerCase()]) {
                setTokenDetails(null);
                return null;
            }
            setTokenDetails(data.result[contractAddress.toLowerCase()]);
            return data.result[contractAddress.toLowerCase()].holders;
        } catch (error) {
            console.error("Error fetching token security data:", error);
            setError(
                error.message || "An error occurred while fetching token data."
            );
            setTokenDetails(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    };
    const handleInputChange = (e) => {
        setContractAddress(e.target.value);
        if (e.target.value.trim() !== "") {
            setHasInput(true);
        }
    };
    const checkHoneypot = async () => {
        setIsLoading(true);
        const honeypotUrl = `https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}`;

        try {
            const response = await fetch(honeypotUrl);
            const data = await response.json();

            if (data && data.honeypotResult) {
                setHoneypotAnalysis(data);
            } else {
                const fallbackAnalysis = {
                    unknownStatus: true,
                    reason:
                        data.simulationError ||
                        "Could not determine the status.",
                };
                setHoneypotAnalysis(fallbackAnalysis);
                console.error("Fallback honeypot analysis:", fallbackAnalysis);
            }
        } catch (error) {
            console.error("Error fetching honeypot data:", error);
            setHoneypotAnalysis(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="font-global">
                <div className="relative mt-10 px-2 w-full flex ">
                    <div className="my-auto     ">
                        <Link to="/dashboard">
                            <IoArrowBackCircle size={45} />
                        </Link>
                    </div>
                    <div className="h-3/4 border-2 div-box rounded-xl mx-auto sm:w-full md:w-3/4 lg:w-1/2 lg:ml-[300px] xl:ml-[310px] 2xl:ml-[480px] py-5 shadow-2xl ">
                        <div className="mx-5 my-5 sm:shadow-2xl md:shadow-none">
                            <Box
                                className="md:flex "
                                sx={{
                                    alignItems: "flex-end",
                                    width: "full",
                                }}>
                                <div className=" md:my-0 sm:flex sm:justify-center sub-font mx-2 ">
                                    <select
                                        className="rounded-lg  sm:w-[70px]   md:w-[110px]  mb-2 "
                                        value={network}
                                        onChange={(e) =>
                                            setNetwork(e.target.value)
                                        }
                                        style={{
                                            color: "white",
                                            backgroundColor: "#333333",
                                            border: "1px solid white",
                                            borderRadius: "5px",
                                            padding: "5px",
                                            textAlign: "center", // Center text
                                            outline: "none",
                                        }}>
                                        <option value="BSC">BSC</option>
                                        <option value="Ethereum">ETH</option>
                                    </select>
                                </div>

                                <div className="flex w-full ">
                                    <input
                                        type="text"
                                        value={contractAddress}
                                        onChange={handleInputChange}
                                        id="contract-address-input"
                                        className="input-cursor" // Add this class
                                        placeholder=" " // Add a space as placeholder
                                        style={{
                                            flexGrow: 1,
                                            background: "black",
                                            color: "white",
                                            fontSize: "15px",
                                            fontFamily:
                                                '"Press Start 2P", sans-serif',
                                            border: "none",
                                            borderBottom: "1px solid white",
                                            padding: "10px",
                                            marginRight: "10px",
                                            outline: "none",
                                        }}
                                    />
                                    <Button
                                        onClick={scanContract}
                                        variant="contained"
                                        style={{
                                            backgroundColor: "#00D084",
                                        }}>
                                        QuickScan
                                    </Button>
                                </div>
                            </Box>
                        </div>
                    </div>
                </div>
                <div id="container" ref={chartContainerRef}></div>
                {tokenDetails ? (
                    <div></div>
                ) : hasInput ? (
                    <div className=" text-center text-4xl my-5">
                        <span>⚠️ </span>{" "}
                        <span>PLEASE CHECK THE ADDRESS/NETWORK</span>
                    </div>
                ) : (
                    <div className=" text-center text-4xl my-5">
                        <p> PLEASE INPUT ADDRESS AND PICK CORRECT NETWORK</p>
                    </div>
                )}
                {hasScanned ? (
                    <div className="md:grid md:grid-cols-2 sm:grid-cols-1 2xl:mx-[300px]  my-[20px]">
                        <div className="mx-auto ">
                            {isLoading ? (
                                <div className="flex justify-center items-center mt-5">
                                    <CircularProgress />
                                </div>
                            ) : (
                                <div>
                                    {error && (
                                        <p className="error-message">{error}</p>
                                    )}
                                    {tokenDetails ? (
                                        <div className="mx-3 mt-[40px] div-box px-5 py-5 rounded-md bg-opacity-40 tracking-widest  shadow-2xl">
                                            {contractAnalysis.map(
                                                (line, index) => (
                                                    <p
                                                        key={index}
                                                        className={
                                                            line.className
                                                        }>
                                                        {line.text}
                                                    </p>
                                                )
                                            )}

                                            {tokenDetails.is_mintable === 1 ? (
                                                <span className="font-margin">
                                                    ❌ MINT FUNCTION -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="font-margin">
                                                    ✅ MINT FUNCTION -{" "}
                                                    <span className="text-green-500">
                                                        NO
                                                    </span>
                                                </span>
                                            )}
                                            {tokenDetails.transfer_pausable ===
                                            1 ? (
                                                <p className="font-margin">
                                                    ❌ PAUSABLE FUNCTION -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ✅ PAUSABLE FUNCTION -{" "}
                                                    <span className="text-green-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}
                                            {tokenDetails.slippage_modifiable ===
                                            1 ? (
                                                <p className="font-margin">
                                                    ✅ MODIFY BUY/SELL TAX -{" "}
                                                    <span className="text-red-500">
                                                        NO
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ❌ MODIFY BUY/SELL TAX -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </p>
                                            )}
                                            {tokenDetails && (
                                                <div>
                                                    {tokenDetails.owner_balance /
                                                        tokenDetails.total_supply >
                                                    0.05 ? (
                                                        <p className="font-margin">
                                                            ⚠️ CREATOR HOLDS
                                                            MORE THAN 5% OF
                                                            TOTAL TOKEN SUPPLY -{" "}
                                                            <span className="text-red-500">
                                                                YES
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <p className="font-margin">
                                                            ✅ CREATOR HOLDS
                                                            MORE THAN 5% OF
                                                            TOTAL TOKEN SUPPLY -{" "}
                                                            <span className="text-green-500">
                                                                NO
                                                            </span>
                                                        </p>
                                                    )}
                                                    {/* other token details rendering */}
                                                </div>
                                            )}
                                            {tokenDetails.can_take_back_ownership ===
                                            1 ? (
                                                <p className="font-margin">
                                                    ❌ RECLAIM OWNERSHIP
                                                    FUNCTION -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ✅ RECLAIM OWNERSHIP
                                                    FUNCTION -{" "}
                                                    <span className="text-green-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}

                                            {tokenDetails.owner_change_balance ===
                                            1 ? (
                                                <p className="font-margin">
                                                    ❌ FUNCTION TO CHANGE
                                                    BALANCE -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ✅ FUNCTION TO CHANGE
                                                    BALANCE -{" "}
                                                    <span className="text-green-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}

                                            {tokenDetails.hidden_owner === 1 ? (
                                                <p className="font-margin">
                                                    ❌ CONTRACT HAS HIDDEN
                                                    OWNERS -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ✅ CONTRACT HAS HIDDEN
                                                    OWNERS -{" "}
                                                    <span className="text-green-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}

                                            {tokenDetails.selfdestruct === 1 ? (
                                                <p className="font-margin">
                                                    ❌ HAS SELF DESTRUCT
                                                    FUNCTION -{" "}
                                                    <span className="text-red-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ✅ HAS SELF DESTRUCT
                                                    FUNCTION -{" "}
                                                    <span className="text-green-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}

                                            {tokenDetails.is_anti_whale ===
                                            "1" ? (
                                                <p className="font-margin">
                                                    ✅ HAS ANTI-WHALE FUNCTION -{" "}
                                                    <span className="text-green-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ❌ HAS ANTI-WHALE FUNCTION -{" "}
                                                    <span className="text-red-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}

                                            {verificationStatus ===
                                            "This contract is verified." ? (
                                                <p className="font-margin">
                                                    ✅ CONTRACT VERIFIED -{" "}
                                                    <span className="text-green-500">
                                                        YES
                                                    </span>
                                                </p>
                                            ) : (
                                                <p className="font-margin">
                                                    ❌ CONTRACT VERIFIED -{" "}
                                                    <span className="text-red-500">
                                                        NO
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className=" ">
                            {" "}
                            {isLoading ? (
                                <div className="flex justify-center items-center mt-5">
                                    <CircularProgress />
                                </div>
                            ) : (
                                <div className="grid md:grid-rows-2 sm:grid-rows-1 space-y-5 tracking-widest ">
                                    {honeypotAnalysis ? (
                                        <div className="div-box bg-opacity-40 px-5 py-5 sm:mx-3 rounded-md  sm:mt-[20px] md:mt-[50px] shadow-2xl ">
                                            <>
                                                <div>
                                                    <span className="text-yellow-500 text-2xl font-title">
                                                        HONEYPOT CHECKER{" "}
                                                    </span>
                                                    <br />
                                                    {honeypotAnalysis.honeypotResult ? (
                                                        honeypotAnalysis
                                                            .honeypotResult
                                                            .isHoneypot ? (
                                                            <div className="flex space-x-2 text-center ">
                                                                <p className="font-margin">
                                                                    ✅ HONEYPOT
                                                                    -{" "}
                                                                    <span className="text-red-500">
                                                                        YES
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex space-x-2 text-center">
                                                                <p className="font-margin">
                                                                    ✅ HONEYPOT
                                                                    -{" "}
                                                                    <span className="text-green-500">
                                                                        NO
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <p>
                                                            Unable to determine
                                                            honeypot status.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="">
                                                    <p className="font-margin">
                                                        TOKEN BASIC ANALYSIS:
                                                    </p>
                                                    {honeypotAnalysis.token && (
                                                        <>
                                                            <div className="font-margin">
                                                                <span className="">
                                                                    TOKEN NAME:{" "}
                                                                </span>
                                                                <span>
                                                                    {
                                                                        honeypotAnalysis
                                                                            .token
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                            {tokenDetails ? (
                                                                <div className=" flex font-margin">
                                                                    <span className=" my-auto">
                                                                        Token
                                                                        Symbol:{" "}
                                                                    </span>
                                                                    <span>
                                                                        $
                                                                    </span>
                                                                    <span className=" ">
                                                                        {
                                                                            tokenDetails.token_symbol
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                            <div className="font-margin">
                                                                <span className=" ">
                                                                    TOTAL
                                                                    HOLDERS:{" "}
                                                                </span>
                                                                <span>
                                                                    {
                                                                        honeypotAnalysis
                                                                            .token
                                                                            .totalHolders
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="font-margin">
                                                                <span className="">
                                                                    Max Buy:{" "}
                                                                </span>
                                                                <span>
                                                                    {honeypotAnalysis
                                                                        ?.simulationResult
                                                                        ?.maxBuy
                                                                        ?.token
                                                                        ? `${honeypotAnalysis.simulationResult.maxBuy.token} ${honeypotAnalysis.token.symbol}`
                                                                        : "NO BUY LIMIT"}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {tokenDetails ? (
                                                    <p className="font-margin">
                                                        <span className="">
                                                            {" "}
                                                            Total Supply:{" "}
                                                        </span>

                                                        {
                                                            tokenDetails.total_supply
                                                        }
                                                    </p>
                                                ) : null}
                                                {honeypotAnalysis.simulationResult && (
                                                    <>
                                                        <div className="font-margin">
                                                            <p className=" text-xl">
                                                                Buy Tax:{" "}
                                                                <span
                                                                    className={
                                                                        honeypotAnalysis
                                                                            .simulationResult
                                                                            .buyTax >
                                                                        15
                                                                            ? "text-red-500"
                                                                            : "text-green-500"
                                                                    }>
                                                                    {honeypotAnalysis.simulationResult.buyTax.toFixed(
                                                                        2
                                                                    )}
                                                                    %
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <div className="font-margin">
                                                            <p className="text-xl">
                                                                Sell Tax:{" "}
                                                                <span
                                                                    className={
                                                                        honeypotAnalysis
                                                                            .simulationResult
                                                                            .sellTax >
                                                                        15
                                                                            ? "text-red-500"
                                                                            : "text-green-500"
                                                                    }>
                                                                    {honeypotAnalysis.simulationResult.sellTax.toFixed(
                                                                        2
                                                                    )}
                                                                    %
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </>

                                            <div></div>
                                        </div>
                                    ) : null}
                                    {/* {tokenDetails && tokenDetails.holders && (
                                    <div className="div-box bg-opacity-40 px-5 py-5 sm:mx-3 rounded-md  mt-[40px] shadow-2xl ">
                                        <div className="bg-dark-600 text-black p-4 rounded-lg">
                                            <h2 className="text-xl font-bold mb-4 text-yellow-500">
                                                Top 10 Holders
                                            </h2>
                                            <div className="overflow-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left text-yellow-500">
                                                                Address
                                                            </th>
                                                            <th className="text-left text-yellow-500">
                                                                Balance
                                                            </th>
                                                            <th className="text-left text-yellow-500">
                                                                Percent
                                                            </th>
                                                            <th className="text-left text-yellow-500">
                                                                Type
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {tokenDetails.holders
                                                            .slice(0, 10)
                                                            .map(
                                                                (
                                                                    holder,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            index
                                                                        }>
                                                                        <td className="truncate">
                                                                            {truncateAddress(
                                                                                holder.address
                                                                            )}
                                                                        </td>
                                                                        <td className="text-left">
                                                                            {formatBalance(
                                                                                holder.balance
                                                                            )}
                                                                        </td>
                                                                        <td className="text-left">{`${formatPercentage(
                                                                            holder.percent
                                                                        )}%`}</td>
                                                                        <td className="text-left">
                                                                            {holder.is_contract ===
                                                                                1 &&
                                                                            holder.is_locked ===
                                                                                1
                                                                                ? "LP"
                                                                                : holder.is_contract ===
                                                                                  1
                                                                                ? "Contract"
                                                                                : "Wallet"}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )} */}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default Scanner;

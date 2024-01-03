// Navbar.js
import React, { useState, useEffect } from "react";
import "./navbar.css";
import logo from "../images/logo.png";
import Sidebar from "../sidebar/sidebar";

function Navbar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div>
            <nav>
                <div className="container">
                    <div className="flex">
                        <img src={logo} alt="" className="logo" />
                        <span className="font">SPHERE</span>
                    </div>

                    <div className="profile-area">
                        <button
                            id="menu-btn"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden ...">
                            <span className="material-symbols-sharp">menu</span>
                        </button>
                    </div>
                </div>
            </nav>
            <Sidebar
                isOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
        </div>
    );
}

export default Navbar;

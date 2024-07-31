import React from "react";
import { FaTwitter, FaTelegram } from "react-icons/fa";
import { BsGlobe } from "react-icons/bs";

function FooterNoBannerMain() {
    return (
        <div className="flex flex-col justify-center items-center  text-white text-center ">
            <div className=" bottom-10 left-0 right-0 flex justify-center items-center space-x-7 ">
                <a
                    href="https://t.me/Sphereprotocol"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-4xl">
                    <FaTelegram />
                </a>
                <a
                    href="http://twitter.com/spherebsc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-4xl">
                    <FaTwitter />
                </a>
                <a
                    href="https://sphereprotocol.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-4xl">
                    <BsGlobe />
                </a>
            </div>
            <div className=" bottom-2 left-0 right-0 mt-5">
                ©2024 Sphere Protocol | All Rights Reserved
            </div>
        </div>
    );
}

export default FooterNoBannerMain;

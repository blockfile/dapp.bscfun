/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        screens: {
            sm: "320px", // Small devices, now set to 320px
            md: "768px", // Tablets
            lg: "1024px", // Smaller laptops
            xl: "1280px", // Desktops
            "2xl": "1536px", // Large screens
        },
        extend: {},
    },
    plugins: [require("tailwind-scrollbar")],
};

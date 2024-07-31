import "./App.css";
import Navbar from "./components/navbar/navbar";
import { useRoutes } from "react-router-dom";
import Maintenance from "./pages/maintenance";
import Scanner from "../src/pages/scanner/scanner";
// import NavbarSolo from "./components/navbar/navbarsolo";
import Main from "../src/pages/locker/Main/main";
import Unlocker from "../src/pages/locker/Unlocker/unlocker";
import Locker from "../src/pages/locker/Locker/locker";
import TokenDetails from "../src/pages/locker/Main/tokendetails";
function App() {
    let element = useRoutes([
        {
            path: "/",
            element: <Navbar />,
        },
        {
            path: "/dashboard",
            element: <Navbar />,
        },
        {
            path: "/dexlimit",
            element: <Maintenance />,
        },
        {
            path: "/swap",
            element: <Maintenance />,
        },
        {
            path: "/rugcheker",
            element: <Scanner />,
        },
        {
            path: "/main",
            element: <Main />,
        },
        {
            path: "/locker",
            element: <Locker />,
        },
        {
            path: "/unlocker",
            element: <Unlocker />,
        },
        {
            path: "/main/:trans_token",
            element: <TokenDetails />,
        },
        {
            path: "/scan",
            element: <Maintenance />,
        },
        {
            path: "/wallet",
            element: <Maintenance />,
        },
    ]);
    return (
        <div className="App bg-black  overflow-x-hidden overflow-y-hidden ">
            {element}
        </div>
    );
}

export default App;

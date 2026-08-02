// components/Layout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
    const [search, setSearch] = useState("");

    return (
        <div className="flex h-screen md:ml-20">
            <Sidebar  />
            <div className="flex-1 flex flex-col  ">

                    <Header />
                    {/* notifications, calendar, profile icons go here too */}
           
                <main className="flex-1 overflow-y-auto p-6">
                
                    <Outlet context={{ search }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import Header from "./Header";

const Layout = () => {
    const [search, setSearch] = useState("");

    return (
        <div className="flex h-screen ml-20">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-full">
                <Header search={search} onSearchChange={setSearch} headerTitle="Employee Management" />
                <main className="flex-1  p-6 overflow-y-automin-h-0">
                    <Outlet context={{ search, setSearch }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
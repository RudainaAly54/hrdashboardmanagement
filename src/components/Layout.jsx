import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import Header from "./Header";

const Layout = () => {
    const [search, setSearch] = useState("");

    return (
        <div className="flex h-full max-w-screen  md:ml-20">
           <Sidebar />
            <div className="flex-1 flex flex-col ">
                <Header search={search} onSearchChange={setSearch} headerTitle="Employee Management" />
                <div className="flex-1  p-6 ">
                    <Outlet context={{ search, setSearch }} />
                </div>
            </div>
        </div>
    );
};

export default Layout;
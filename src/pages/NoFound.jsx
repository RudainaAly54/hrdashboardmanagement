import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {motion} from "framer-motion"
import { FiSearch, FiArrowLeft } from "react-icons/fi";
import { MdDashboard, MdOutlineExploreOff } from "react-icons/md";


const TOOLS = [
    {id: 1, keys:["employee", "directory", "staff"], path: "/employees"},
    {id: 2, keys:["department", "dept"], path: "/departments"},
    {id: 3, keys:["attendance"], path: "/attendence"},
    {id: 4, keys:["leave"], path: "/leave-request"},
    {id: 5, keys:["payroll", "salary"], path: "/payroll"},
    {id: 6, keys:["report"], path: "/reports"},
    {id: 7, keys:["settings"], path: "/settings"},
    {id: 8, keys: ["dashboard", "home"], path: "/dashboard"}
]

const  QUICK_LINKS = [
    {id: 1,label: "Employee Directory", path: "/employees"},
    {id: 2, label: "Leave Policy", path: "/leave-request"},
    {id: 3,label: " Support Desk", path: "/settings"}
]

const NoFound  = () => {
    const navigate = useNavigate()
    const [query, setQuery] = useState("")
    const [noMatch, setNoMatch] = useState(false)

    const handleSearch = (e) => {
        e.preventDefault()
        const q = query.trim().toLowerCase()
        if (!q) return;
        const match = TOOLS.find(t => t.keys.some(k => q.includes(k) || k.includes(q)))
        if (match) navigate(match.path)
        else setNoMatch(true)
    }

    const handleBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/dashboard"))

return (
    <section className="relative min-h-screen w-full bg-[#f9f9f8] flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
        <motion.div
        initial = {{opacity: 0, y: 12}}
        animate = {{opacity:1, y: 0}}
        transition={{duration: 0.4}}
        className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 w-full max-w-6xl "
        >
            {/* Left */}
            <div className="flex flex-col gap-4 lg:w-[40%]">
                <div className="relative w-fit">
                    <span className="text-[120px] leading-none font-bold text-[#639987]/15 select*none">404</span>
                    <MdOutlineExploreOff className="absolute top-1/2 left-0 -translate-y-1/2 text-[#3f7d65]" size = {88}/>
                </div>

                <h1 className="text-4cl font-semibold text-[#1a1a1a]">Page Not Found</h1>
                <p className="text-gray-600 text-lg">
                    The resource you are looking for might have been removed, had its name changed, or is temporarily unavailable
                </p>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-5 w-full lg:w-[55%]">
                <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm p-8 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#639987]/10" />

                    <form onSubmit={handleSearch} className="relative flex flex-col gap-4">
                        <p className="text-xs tracking-widest text-gray-500 uppercase mt-6">Try searching for a tool</p>
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                            <input 
                            type="text"
                            value={query}
                            onChange={e => {setQuery(e.target.value); setNoMatch(false)}}
                            placeholder="Search employees, payroll, or reports...."
                            className="w-full pl-11 py-3.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a8c3b9]"
                            />
                        </div>
                        {noMatch && <p className="text-xs text-red-500">No matching tool found</p>}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-600">
                            <span>Quick Links: </span>
                            {QUICK_LINKS.map((l, i) => (
                                <span 
                                key={l.id}
                                className="flex items-center gap-3"
                                >
                                    <Link to = {l.path} className="text-[#2f6b55] font-medium hover:underline">{l.label}</Link>
                               {i < QUICK_LINKS.length - 1 && <span className="w-1 h-1 rounded-full bg-gray-300"/>}
                                </span>
                            ))}
                        </div>
                    </form>

                    <div className="border-t border-gray-10 my-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_f1fr] gap-4">
                        <button 
                        onClick={() => navigate("/dashboard")}
                            className="flex items-center justify-center gap-3 h-14 rounded-lg bg-[#2f6b55] text-white font-medium hover:bg-[#2f4f42] transition"
                            >
                                <MdDashboard size={20}/> Return to Dashboard
                            </button>
                            <button
                            onClick={handleBack}
                            className = "flex items-center justify-center gap-3h-14 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium hover:bg-gray-500 transition"
                            >
                                <FiArrowLeft size={20}/> Go Back
                            </button>
                    </div>
                </div>

             
            </div>
        </motion.div>
         <footer className="absolute bottom-6 flex items-center gap-3 text-sm text-gray-500">
                <span className="font-semibold">ElevateHR</span>
                <span className="h-4 border-l border-gray-300" />
                <span className="tracking-wide">Enterprise Admin Portal</span>
            </footer>
    </section>
)
}

export default NoFound
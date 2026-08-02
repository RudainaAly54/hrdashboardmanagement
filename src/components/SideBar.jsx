import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

/* Icons */
import { IoMdPeople } from "react-icons/io";
import { MdDashboard, MdInsertChartOutlined } from "react-icons/md";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { FaRegCalendarTimes, FaRegCalendarCheck } from "react-icons/fa";
import { FaMoneyBills } from "react-icons/fa6";
import { CiSettings } from "react-icons/ci";
import { HiMenuAlt2, HiX } from "react-icons/hi";

const SideBar = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const pagesNav = [
        { name: 'Dashboard', path: '/dashboard', icon: <MdDashboard style={{ color: '#F9F9F8' }} size={18} /> },
        { name: 'Employees', path: '/employees', icon: <IoMdPeople style={{ color: '#F9F9F8' }} size={18} /> },
        { name: 'Departments', path: '/departments', icon: <HiOutlineBuildingOffice2 style={{ color: '#F9F9F8' }} size={18} /> },
        { name: 'Attendance', path: '/attendance', icon: <FaRegCalendarCheck style={{ color: '#F9F9F8' }} size={18} /> },
        { name: "Leave Request", path: '/leave-request', icon: <FaRegCalendarTimes style={{ color: '#F9F9F8' }} size={18} /> },
        { name: 'Payroll', path: '/payroll', icon: <FaMoneyBills style={{ color: '#F9F9F8' }} size={18} /> },
        { name: 'Reports', path: '/reports', icon: <MdInsertChartOutlined style={{ color: '#F9F9F8' }} size={18} /> },
        { name: 'Settings', path: '/settings', icon: <CiSettings style={{ color: '#F9F9F8' }} size={18} /> },
    ];

    // On desktop, expanded = hovered. On mobile, expanded = opened (labels always show when open).
    const isExpanded = isHovered || isMobileOpen;

    return (
        <>
            {/* Mobile toggle button — only visible below lg breakpoint */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-[#2C2C2E] p-2 rounded-lg shadow-lg"
            >
                <HiMenuAlt2 style={{ color: '#F9F9F8' }} size={24} />
            </button>

        
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

          <motion.aside
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    animate={{ width: isHovered ? 256 : 80 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={`
        bg-[#2C2C2E] fixed top-0 left-0 h-screen p-5 flex flex-col gap-5 shadow-lg shadow-[#2C2C2E] z-50
        w-64 transition-transform duration-300 
               ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:!w-auto
    `}
>
                {/* Mobile close button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden absolute top-5 right-5 text-[#F9F9F8]"
                >
                    <HiX size={20} />
                </button>

                <div className="flex gap-3 items-center overflow-hidden">
                    <div
                        style={{ backgroundColor: '#639987', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', transition: 'background-color 0.3s ease', width: '3rem', height: '3rem', flexShrink: 0 }}
                    >
                        <IoMdPeople style={{ color: '#F9F9F8' }} size={28} />
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <h3 className="text-[#F9F9F8] text-lg font-bold">ElevateHR</h3>
                                <p className="text-gray-500 text-xs">Enterprise Admin</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="flex flex-col gap-2">
                    {pagesNav.map((page, index) => (
                        <NavLink
                            to={page.path}
                            key={index}
                            onClick={() => setIsMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-3 rounded-lg transition overflow-hidden ${isActive ? 'bg-[#639987] text-[#F9F9F8]' : 'text-[#F9F9F8] hover:bg-[#A8C3B9] hover:text-[#F9F9F8]'
                                }`
                            }
                        >
                            <span className="flex-shrink-0">{page.icon}</span>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-sm font-[inter] whitespace-nowrap overflow-hidden"
                                    >
                                        {page.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    ))}
                </nav>
            </motion.aside>
        </>
    );
};

export default SideBar;
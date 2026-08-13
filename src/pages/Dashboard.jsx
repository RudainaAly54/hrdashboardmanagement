import { useState, useMemo } from "react"
import { useAsync } from "../Hooks/useAsync"
import { employeeCRUD } from '../api/api'
import {Link} from 'react-router-dom'
import EmployeeFormModal from '../components/EmployeeFormModal'
import ConfirmDialog from '../components/CofirmDialog'
import MoreFiltersPanel from '../components/MoreFiltersPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { motion } from "framer-motion"
import { IoPersonAddOutline, IoFilter, IoLocationOutline } from "react-icons/io5";
import { MdSort } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import IconsComp from '../components/IconsComp'

const Dashboard = () => {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formMode, setFormMode] = useState("create")
    const [activeEmployee, setActiveEmployee] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({ deptName: null, status: null, city: null })
    const [sortAsc, setSortAsc] = useState(true)

    const { data: employees, loading, error, refetch } = useAsync(
        () =>
            employeeCRUD.getAll({
                orderBy: "fullName",
                ascending: sortAsc,
                filters: Object.fromEntries(
                    Object.entries(filters).filter(([, v]) => v)
                ),
             
                selectQuery: "*, department:DeptId(DeptName, core, Icon)"
            }),
        [sortAsc, filters]
    )

    const emp = useMemo(() => {
        const list = employees || []
        const seen = new Set()
        return list.filter((item) => {
            const core = item.department?.core
            if (seen.has(core)) return false
            seen.add(core)
            return true
        })
    }, [employees])

    const handleAdd = () => {
        setFormMode("create")
        setActiveEmployee(null)
        setIsFormOpen(true)
    }

    const handleEdit = (employee) => {
        setFormMode("edit")
        setActiveEmployee(employee)
        setIsFormOpen(true)
        setOpenMenuId(null)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await employeeCRUD.remove(deleteTarget.id)
            await refetch()
        } finally {
            setDeleting(false)
            setDeleteTarget(null)
        }
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-10"
        >
            <div className="flex justify-between flex-wrap bg-[#F9F9F8] rounded-lg shadow-xl p-5">
                <div className="flex flex-col gap-10 w-[45%]">
                    <h1 className="text-5xl font-bold">
                        Grow Your Team <span className="block text-[#A8C3B9]">with ease</span>
                    </h1>
                    <p className="text-gray-500">
                        Welcome back, Ann. You have 3 new onboarding sessions today and 2 pending leave requests to review. Ready to expand the workforce?
                    </p>

                    <button
                        onClick={handleAdd}
                        className="w-48 h-10 rounded-lg bg-[#639987] text-[#F9F9F8] flex items-center justify-center gap-3 cursor-pointer hover:bg-[#A8C3B9]"
                    >
                        <IoPersonAddOutline size={20} className="text-[#F9F9F8]" /> Add Employee
                    </button>
                </div>

                <div>
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcbainy7EKFACZxqSA2lPiwkO6yBNUDBKOCnaoCw3FvD3Rf8PVcWI5YvGrqmoc1YSElUNHjvJdTEbN4-RIK5XBUyf0grvc0prPtB91AEvPyIUBEAziPqQhTNh35qVJMr7FBcNJlPD7yC6ecpHhs498mv0jwemE0U9_E6LXDiHthJNR1niZY0k17JomD5GBHPhsyQEbG0ap4lfAITQyFIBXh_DcBw-bNatpZpqWhSQz5nB544cuwUwx"
                        alt="team"
                        className="hover:-rotate-[15deg] transition-all duration-700"
                    />
                </div>
            </div>

            <div className="flex justify-between relative">
                <h2 className="text-3xl">Active Rosters</h2>

                <div className="flex items-center justify-center gap-2 flex-wrap relative">
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className="border border-1 border-black rounded-lg p-2 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <IoFilter /> Filter
                    </button>
                    <button
                        onClick={() => setSortAsc(v => !v)}
                        className="border border-1 border-black rounded-lg p-2 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <MdSort /> Sort {sortAsc ? "A→Z" : "Z→A"}
                    </button>

                    {showFilters && (
                        <MoreFiltersPanel
                            onApply={(f) => setFilters(f)}
                            onClose={() => setShowFilters(false)}
                        />
                    )}
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <p className="text-red-500">Something went wrong loading employees: {error}</p>
            ) : (
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {emp.length === 0 ? (
                        <p>No employees found</p>
                    ) : (
                        emp.map((item) => {
                            return (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-3 bg-white rounded-lg shadow-xl p-5"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={item.PhotoUrl}
                                                alt={item.fullName}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                            <div>
                                                <Link
                                                to = {`/employees/empDetails/${item.id}`}
                                                className="text-lg font-semibold hover:text-[#A8C3B9] cursor-pointer">{item.fullName}</Link>
                                                <p className="text-gray-500 text-sm">{item.role}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>

                                    <div className="flex items-center justify-between border-t pt-3 mt-1">
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <IconsComp iconName={item.department?.Icon} size={16} />
                                                {item.department?.core}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <IoLocationOutline size={16} />
                                                {item.city}
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                                className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                                            >
                                                <HiOutlineDotsVertical size={18} />
                                            </button>
                                            {openMenuId === item.id && (
                                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTarget(item); setOpenMenuId(null) }}
                                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            <EmployeeFormModal
                isOpen={isFormOpen}
                mode={formMode}
                employee={activeEmployee}
                onClose={() => setIsFormOpen(false)}
                onSuccess={async () => {
                    setIsFormOpen(false)
                    await refetch()
                }}
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete employee"
                message={deleteTarget ? `Remove ${deleteTarget.fullName}? This can't be undone.` : ""}
                loading={deleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
            />
        </motion.section>
    )
}

export default Dashboard
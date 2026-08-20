/* Components */
import StatusBadge from "../components/StatusBadge"
import Pagination from "../components/Pagination"
import QuickFilters from "../components/QuickFilters";
import MoreFiltersPanel from "../components/MoreFiltersPanel";
import EmployeeFormModal from '../components/EmployeeFormModal';
import ConfirmDialog from '../components/CofirmDialog'
import SkeletonLoader from "../components/SkeletonLoader";

/* Libraries */
import { motion } from "framer-motion"

/* Hooks & Context */
import { useState, useEffect, useRef } from "react"
import { createClient } from "../lib/supabaseClient"
import { useOutletContext, Link } from "react-router-dom"
import { downloadCSV } from '../lib/downloadCSV'
import { useToast } from "../context/ToastContext";
import { employeeCRUD } from "../api/api";

/* Icons */
import { FiDownload, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaUsers } from "react-icons/fa";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { HiOutlineSparkles } from "react-icons/hi2";

// employeeCRUD.count() only supports exact-match (.eq) filters, so the
// "New Hires this month" count (a >= date range) still needs a direct
// Supabase call — everything else below goes through the shared CRUD.
const supabase = createClient();
const TABLE_NAME = 'Employees';
const PAGE_SIZE = 5;

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [onLeaveCount, setOnLeaveCount] = useState(0);
    const [newHiresCount, setNewHiresCount] = useState(0);

    const [filters, setFilters] = useState({ deptName: null, status: null, city: null });
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);

    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const toggleRow = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const { search } = useOutletContext(); // shared search term, owned by Layout
    const cacheRef = useRef(new Map());
    const { showToast } = useToast();

    // 1. reset to page 1 whenever the search term or filters change, so a
    // narrowed result set never leaves the user on a page that no longer exists.
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    // 2. main paginated fetch, via the shared CRUD's getPage()
    useEffect(() => {
        const fetchEmployees = async () => {
            const cacheKey = JSON.stringify({ page, search, filters });

            if (cacheRef.current.has(cacheKey)) {
                const cached = cacheRef.current.get(cacheKey);
                setEmployees(cached.data);
                setTotalCount(cached.count);
                setMessage("");
                return;
            }

            setLoading(true);
            setMessage("");

            try {
                const { data, count } = await employeeCRUD.getPage({
                    page,
                    pageSize: PAGE_SIZE,
                    orderBy: "fullName",
                    searchColumn: "fullName",
                    searchTerm: search,
                    filters,
                });

                setEmployees(data);
                setTotalCount(count);
                cacheRef.current.set(cacheKey, { data, count });
            } catch (err) {
                console.error("Error fetching employees:", err);
                setMessage(err.message || "An error occurred while fetching employees data");
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [page, search, filters]);

    // 3. summary card counts — reflects the WHOLE table, not just the current page
    useEffect(() => {
        const fetchSummaryCounts = async () => {
            try {
                const [active, onLeave] = await Promise.all([
                    employeeCRUD.count({ status: "Active" }),
                    employeeCRUD.count({ status: "On Leave" }),
                ]);

                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
                const { count: newHires } = await supabase
                    .from(TABLE_NAME)
                    .select("*", { count: "exact", head: true })
                    .gte("joinDate", startOfMonth);

                setActiveCount(active);
                setOnLeaveCount(onLeave);
                setNewHiresCount(newHires ?? 0);
            } catch (err) {
                console.error("Error fetching summary counts:", err);
            }
        };
        fetchSummaryCounts();
    }, [refreshKey]);

    const totalPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));


    const handleExportCSV = async () => {
        setExporting(true);
        try {
            let data = await employeeCRUD.getAll({ orderBy: "fullName", filters });

            if (search) {
                data = data.filter((emp) =>
                    emp.fullName.toLowerCase().includes(search.toLowerCase())
                );
            }

            if (!data || data.length === 0) {
                setMessage("No employees to export");
                showToast("No employees to export", "error");
                return;
            }

            const stamp = new Date().toISOString().slice(0, 10);
            downloadCSV(data, `employees_${stamp}.csv`);
            showToast(`Exported ${data.length} employees to CSV`, "success");
        } catch (err) {
            console.error("Error Exporting Employees", err);
            setMessage(err.message || "Something went wrong while exporting");
            showToast("Export failed — please try again", "error");
        } finally {
            setExporting(false);
        }
    };

    const handleEmployeeAdded = () => {
        setIsAddModalOpen(false);
        cacheRef.current.clear();
        setPage(1);
        setRefreshKey((k) => k + 1);
        showToast("Employee added successfully!", "success");
    };

    const handleEditClick = (emp) => {
        setEditingEmployee(emp);
        setIsEditingModalOpen(true);
    };

    const handleEmployeeUpdated = () => {
        setEditingEmployee(null);
        setIsEditingModalOpen(false);
        cacheRef.current.clear();
        setRefreshKey((k) => k + 1);
        showToast("Employee updated successfully!", "success");
    };

    const handleDeleteConfirmed = async () => {
        setDeleting(true);
        try {
            await employeeCRUD.remove(deletingEmployee.id);

            setEmployees((prev) => prev.filter((emp) => emp.id !== deletingEmployee.id));
            setTotalCount((prev) => Math.max(0, prev - 1));
            cacheRef.current.clear();
            setRefreshKey((k) => k + 1);

            showToast("Employee deleted successfully", "success");
        } catch (err) {
            console.error("Error deleting employee:", err);
            showToast(err.message || "Couldn't delete employee", "error");
        } finally {
            setDeleting(false);
            setDeletingEmployee(null);
        }
    };

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col max-w-full h-full p-6 gap-5"
            >
                {/* Page Header Row */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-[manrope]">Employee Directory</h1>
                        <p className="text-gray-500 text-sm">Manage your team across all regions.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="flex items-center gap-2 px-4 py-2 border-gray-600 rounded-lg text-[#f9f9f8] text-sm font-medium bg-[#2C2C2E] hover:bg-gray-500 transition"
                        >
                            <FiDownload size={16} /> {exporting ? "Exporting..." : "Export CSV"}
                        </button>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#639987] text-[#F9F9F8] rounded-lg text-sm font-medium hover:bg-[#A8C3B9] transition"
                        >
                            <FiPlus size={16} /> Add Employee
                        </button>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Staff</p>
                            <FaUsers className="text-[#639987]" size={18} />
                        </div>
                        <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">On Leave</p>
                            <FaUmbrellaBeach className="text-[#639987]" size={18} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold">{onLeaveCount}</p>
                            <span className="text-xs text-[#639987]">
                                {totalCount > 0 ? `${((onLeaveCount / totalCount) * 100).toFixed(1)}% of total` : ""}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">New Hires</p>
                            <HiOutlineSparkles className="text-[#639987]" size={18} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold">{newHiresCount}</p>
                            <span className="text-xs text-[#639987] font-medium">This Month</span>
                        </div>
                    </div>

                    <div className="relative">
                        <QuickFilters
                            filters={filters}
                            onRemoveFilter={(key) => setFilters(prev => ({ ...prev, [key]: null }))}
                            onClearAll={() => setFilters({ deptName: null, status: null, city: null })}
                            onOpenMore={() => setIsMoreFiltersOpen(true)}
                        />
                        {isMoreFiltersOpen && (
                            <MoreFiltersPanel
                                onApply={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
                                onClose={() => setIsMoreFiltersOpen(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Employee Table */}
                <div className="bg-[#F9F9F8] border border-gray-200 rounded-xl overflow-hidden">
                    {message && (
                        <p className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{message}</p>
                    )}

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 text-xs uppercase border-b">
                                <th className="p-4 font-medium flex gap-10">
                                    <input type="checkbox" className="h-5 w-5 accent-[#A8C3B9]" /> Employee Name
                                </th>
                                <th className="p-4 font-medium">Department</th>
                                <th className="p-4 font-medium">Join Date</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Actions</th>
                            </tr>
                        </thead>

                        <tbody className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                            {loading && employees.length === 0 ? (
                                <tr>
                                    <SkeletonLoader variant="table" rows={PAGE_SIZE} columns={6} />
                                </tr>
                            ) : employees.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">No Employees Found</td>
                                </tr>
                            ) : (
                                employees.map((emp) => {
                                    const isChecked = selectedIds.has(emp.id);

                                    return (
                                        <tr
                                            key={emp.id}
                                            className={`${isChecked ? 'bg-[rgba(168,195,185,0.1)]' : ""} border-b last:border-0 transition`}
                                        >
                                            <td className="p-4 flex items-center gap-10">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 accent-[#A8C3B9]"
                                                    onChange={() => toggleRow(emp.id)}
                                                    checked={isChecked}
                                                />
                                                <div className="flex items-center gap-3">
                                                    <img src={emp.PhotoUrl} alt={emp.fullName} className="w-9 h-9 rounded-full object-cover" />
                                                    <div>
                                                        <Link to={`/employees/empDetails/${emp.id}`} className="font-medium hover:text-[#639987]">
                                                            {emp.fullName}
                                                        </Link>
                                                        <p className="text-xs text-gray-400">{emp.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">{emp.deptName}</td>
                                            <td className="p-4">
                                                {emp.joinDate
                                                    ? new Date(emp.joinDate).toLocaleDateString('en-US', { month: "short", day: "numeric", year: "numeric" })
                                                    : "--"}
                                            </td>
                                            <td className="p-4">{emp.role}</td>
                                            <td className="p-4">
                                                <StatusBadge status={emp.status} />
                                            </td>
                                            <td className="p-4">
                                                {isChecked ? (
                                                    <div className="flex gap-2 items-center">
                                                        <button onClick={() => handleEditClick(emp)} className="cursor-pointer">
                                                            <FiEdit2 className="text-gray-500" size={16} />
                                                        </button>
                                                        <button onClick={() => setDeletingEmployee(emp)} className="cursor-pointer">
                                                            <FiTrash2 className="text-gray-500" size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400 hover:text-gray-700 cursor-none">
                                                        <BsThreeDotsVertical />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    <Pagination
                        page={page}
                        totalPages={totalPage}
                        totalCount={totalCount}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPage}
                    />
                </div>
            </motion.section>

            <EmployeeFormModal
                mode="create"
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleEmployeeAdded}
            />

            <EmployeeFormModal
                mode="edit"
                isOpen={isEditingModalOpen}
                employee={editingEmployee}
                onClose={() => {
                    setIsEditingModalOpen(false);
                    setEditingEmployee(null);
                }}
                onSuccess={handleEmployeeUpdated}
            />

            <ConfirmDialog
                isOpen={!!deletingEmployee}
                title="Delete this employee?"
                message={deletingEmployee ? `"${deletingEmployee.fullName}" will be permanently removed from the system.` : ""}
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setDeletingEmployee(null)}
                loading={deleting}
            />
        </>
    );
};

export default Employees;
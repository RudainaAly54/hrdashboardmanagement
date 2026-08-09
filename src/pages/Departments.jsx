import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { departmentCRUD } from '../api/api'
import { useAsync } from '../Hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { FiPlus, FiFilter } from "react-icons/fi";
import IconsComp from '../components/IconsComp'
import DepartmentModal from '../components/DepartmentModal'
import DepartmentFilterPanel from '../components/DepartmentFilterPanel'
import ConfirmDialog from '../components/CofirmDialog'

const Departments = () => {
    const { search } = useOutletContext()
    const navigate = useNavigate();
    const { showToast } = useToast();

    const { data: departments, loading, error, refetch } = useAsync(
        () =>
            departmentCRUD.getAll({
                orderBy: "DeptName",
                selectQuery: "*, Employees:headID(fullName, PhotoUrl)",
            }), [])

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deletingDept, setDeletingDept] = useState(null);
    const [removingDept, setRemovingDept] = useState(false);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [category, setCategory] = useState(null);
    const [sortBy, setSortBy] = useState("alphabetical");

    // Filtering + sorting client-side since we already have the whole
    // (small) departments table in memory.
    const filteredDepartments = useMemo(() => {
        if (!departments) return [];

        let result = departments;

        if (search) {
            result = result.filter((d) => d.DeptName.toLowerCase().includes(search.toLowerCase()));
        }
        if (category) {
            result = result.filter((d) => d.core === category);
        }

        result = [...result].sort((a, b) => {
            if (sortBy === "mostEmployees") return (b.NoEmployees ?? 0) - (a.NoEmployees ?? 0);
            if (sortBy === "fewestEmployees") return (a.NoEmployees ?? 0) - (b.NoEmployees ?? 0);
            return a.DeptName.localeCompare(b.DeptName);
        });

        return result;
    }, [departments, search, category, sortBy]);

    const activeManagerCount = filteredDepartments.filter((d) => d.Employees).length;

    const handleCreated = () => {
        setIsCreateOpen(false);
        refetch();
        showToast("Department created successfully!", "success");
    };

    const handleDeleteDept = async () => {
        setRemovingDept(true);
        try {
            await departmentCRUD.remove(deletingDept.id);
            showToast("Department deleted.", "success");
            refetch();
        } catch (err) {
            console.error("Error deleting department:", err);
            showToast(err.message || "Could not delete this department.", "error");
        } finally {
            setRemovingDept(false);
            setDeletingDept(null);
        }
    };

    const sortLabel = sortBy === "alphabetical" ? "Alphabetical" : sortBy === "mostEmployees" ? "Most Employees" : "Fewest Employees";

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className='flex flex-col w-full h-full p-6 gap-5'
        >
            <div className='flex items-center justify-between flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold font-[manrope]'>Organization Units</h1>
                    <p className='text-gray-500 text-sm'>
                        Manage departmental hierarchies and team distribution across the enterprise.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#639987] text-[#F9F9F8] rounded-lg text-sm font-medium hover:bg-[#557f70] transition"
                >
                    <FiPlus size={16} /> Create Department
                </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="relative flex gap-3">
                    <button
                        onClick={() => setIsFilterOpen((prev) => !prev)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                    >
                        <FiFilter size={14} /> Filter{category ? `: ${category}` : ""}
                    </button>
                    <span className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
                        Sort: {sortLabel}
                    </span>

                    {isFilterOpen && (
                        <DepartmentFilterPanel
                            category={category}
                            onCategoryChange={setCategory}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            onClose={() => setIsFilterOpen(false)}
                        />
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    Total Departments: {filteredDepartments.length} · Active Managers: {activeManagerCount}
                </p>
            </div>

            {error && (
                <p className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</p>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {loading ? (
                    <p className='text-gray-400 col-span-full text-center py-8'>Loading Departments ...</p>
                ) : filteredDepartments.length === 0 ? (
                    <p className='text-gray-400 col-span-full text-center py-8'>No departments found.</p>
                ) : (
                    filteredDepartments.map((dept) => (
                        <div
                            key={dept.id}
                            className='bg-white border border-gray-200 rounded-xl p-5 flex flex-col'
                        >
                            <div className='flex items-center justify-between mb-5'>
                                <div className='w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-lg'>
                                    <IconsComp iconName={dept.Icon} className='text-[#639987]' size={20} />
                                </div>
                                <span className='px-3 py-1 rounded-full bg-[#639987]/10 text-[#639987] text-sm font-medium'>
                                    {dept.core}
                                </span>
                            </div>

                            <button
                                onClick={() => navigate(`/departments/deptDetails/${dept.id}`)}
                                className='mb-5 text-left'
                            >
                                <h3 className='font-semibold text-lg hover:text-[#639987] transition'>{dept.DeptName}</h3>
                                <p className='text-sm text-gray-500 flex items-center gap-1'>
                                    {dept.NoEmployees} Employees
                                </p>
                            </button>

                            <div className='flex items-center gap-2 pt-3 border-t'>
                                <img
                                    className='w-10 h-10 rounded-full object-cover'
                                    src={dept.Employees?.PhotoUrl}
                                    alt={dept.Employees?.fullName ?? "No head assigned"}
                                />

                                <div className='w-full flex justify-between items-center'>
                                    <div>
                                        <p className='text-xs text-gray-400'>Head of Dept.</p>
                                        <p className='text-sm font-medium'>{dept.Employees?.fullName ?? "Unassigned"}</p>
                                    </div>

                                    <div className='flex gap-2'>
                                        <button
                                            onClick={() => navigate(`/departments/deptDetails/${dept.id}`)}
                                            className='px-3 h-9 text-[#F9F9F8] bg-[#639987] rounded-lg text-xs font-medium hover:bg-[#557f70] transition'
                                        >
                                            Details
                                        </button>
                                        <button
                                            onClick={() => setDeletingDept(dept)}
                                            className='px-3 h-9 text-[#F9F9F8] bg-red-500 rounded-lg text-xs font-medium hover:bg-red-600 transition'
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <DepartmentModal
                isOpen={isCreateOpen}
                mode="create"
                onClose={() => setIsCreateOpen(false)}
                onSuccess={handleCreated}
            />

            <ConfirmDialog
                isOpen={!!deletingDept}
                title="Delete this department?"
                message={deletingDept ? `"${deletingDept.DeptName}" will be permanently removed.` : ""}
                onConfirm={handleDeleteDept}
                onCancel={() => setDeletingDept(null)}
                loading={removingDept}
            />
        </motion.section>
    )
}
export default Departments
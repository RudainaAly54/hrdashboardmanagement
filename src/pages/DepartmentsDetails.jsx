import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { departmentCRUD, employeeCRUD } from "../api/api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import IconsComp from "../components/IconsComp";
import DepartmentModal from "../components/DepartmentModal";
import EmployeeFormModal from "../components/EmployeeFormModal";
import ConfirmDialog from "../components/CofirmDialog";
import { FiArrowLeft, FiEdit2, FiTrash2, FiUsers, FiDollarSign } from "react-icons/fi";

const DepartmentsDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [department, setDepartment] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
    const [isDeleteDeptOpen, setIsDeleteDeptOpen] = useState(false);
    const [deletingDept, setDeletingDept] = useState(false);

    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [removingEmployee, setRemovingEmployee] = useState(false);

    // Employees are linked to a department by matching `deptName` text —
    // that's what the Add Employee form actually writes, so it's the
    // reliable join key here even though a DeptId FK column also exists.
    const loadData = useCallback(async () => {
        setLoading(true);
        setMessage("");
        try {
            const dept = await departmentCRUD.getById(id);
            setDepartment(dept);

            const staff = await employeeCRUD.getAll({
                filters: { deptName: dept.DeptName },
                orderBy: "fullName",
            });
            setEmployees(staff);
        } catch (err) {
            console.error("Error loading department:", err);
            setMessage(err.message || "Could not load this department.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalSalary = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
    const activeCount = employees.filter((e) => e.status === "Active").length;

    const handleDeptUpdated = () => {
        setIsEditDeptOpen(false);
        loadData();
        showToast("Department updated successfully!", "success");
    };

    const handleDeleteDept = async () => {
        setDeletingDept(true);
        try {
            await departmentCRUD.remove(id);
            showToast("Department deleted.", "success");
            navigate("/departments");
        } catch (err) {
            console.error("Error deleting department:", err);
            showToast(err.message || "Could not delete this department.", "error");
        } finally {
            setDeletingDept(false);
            setIsDeleteDeptOpen(false);
        }
    };

    const handleEmployeeUpdated = () => {
        setEditingEmployee(null);
        loadData();
        showToast("Employee updated successfully!", "success");
    };

    const handleDeleteEmployee = async () => {
        setRemovingEmployee(true);
        try {
            await employeeCRUD.remove(deletingEmployee.id);
            showToast("Employee removed.", "success");
            loadData();
        } catch (err) {
            console.error("Error removing employee:", err);
            showToast(err.message || "Could not remove this employee.", "error");
        } finally {
            setRemovingEmployee(false);
            setDeletingEmployee(null);
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-400">Loading department...</div>;
    }

    if (message || !department) {
        return (
            <div className="p-6">
                <p className="text-red-600 bg-red-50 rounded-lg p-4">{message || "Department not found."}</p>
                <button onClick={() => navigate("/departments")} className="mt-4 text-sm text-[#639987] hover:underline">
                    ← Back to Departments
                </button>
            </div>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col w-full h-full p-6 gap-5"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <button
                    onClick={() => navigate("/departments")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                >
                    <FiArrowLeft size={16} /> Back to Departments
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditDeptOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                    >
                        <FiEdit2 size={14} /> Edit Department
                    </button>
                    <button
                        onClick={() => setIsDeleteDeptOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                    >
                        <FiTrash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#f0f5f3] flex items-center justify-center flex-shrink-0">
                    <IconsComp iconName={department.Icon} className="text-[#639987]" size={28} />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold font-[manrope]">{department.DeptName}</h1>
                        <span className="px-3 py-1 rounded-full bg-[#639987]/10 text-[#639987] text-xs font-medium">
                            {department.core}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Head of Dept.{" "}
                        <span className="font-medium text-gray-700">
                            {department.Employees?.fullName ?? "Unassigned"}
                        </span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 uppercase">Total Employees</p>
                        <FiUsers className="text-[#639987]" size={18} />
                    </div>
                    <p className="text-2xl font-bold mt-1">{employees.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 uppercase">Active</p>
                        <FiUsers className="text-[#639987]" size={18} />
                    </div>
                    <p className="text-2xl font-bold mt-1">{activeCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 uppercase">Total Salary / Month</p>
                        <FiDollarSign className="text-[#639987]" size={18} />
                    </div>
                    <p className="text-2xl font-bold mt-1">
                        {totalSalary.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            <div className="bg-[#F9F9F8] border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500 text-xs uppercase border-b">
                            <th className="p-4 font-medium">Employee Name</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">City</th>
                            <th className="p-4 font-medium">Salary</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                    No employees in this department yet.
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => (
                                <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={emp.PhotoUrl}
                                                alt={emp.fullName}
                                                className="w-9 h-9 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-medium">{emp.fullName}</p>
                                                <p className="text-xs text-gray-400">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">{emp.role}</td>
                                    <td className="p-4">{emp.city}</td>
                                    <td className="p-4">
                                        {Number(emp.salary).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={emp.status} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingEmployee(emp)}
                                                className="text-gray-400 hover:text-[#639987]"
                                                title="Edit employee"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingEmployee(emp)}
                                                className="text-gray-400 hover:text-red-600"
                                                title="Remove employee"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <DepartmentModal
                isOpen={isEditDeptOpen}
                mode="edit"
                initialData={department}
                onClose={() => setIsEditDeptOpen(false)}
                onSuccess={handleDeptUpdated}
            />

            <EmployeeFormModal
                mode="edit"
                isOpen={!!editingEmployee}
                employee={editingEmployee}
                onClose={() => setEditingEmployee(null)}
                onSuccess={handleEmployeeUpdated}
            />

            <ConfirmDialog
                isOpen={isDeleteDeptOpen}
                title="Delete this department?"
                message={`"${department.DeptName}" will be permanently removed. Employees currently in it will keep their department name but no longer link to a department record.`}
                onConfirm={handleDeleteDept}
                onCancel={() => setIsDeleteDeptOpen(false)}
                loading={deletingDept}
            />

            <ConfirmDialog
                isOpen={!!deletingEmployee}
                title="Remove this employee?"
                message={deletingEmployee ? `"${deletingEmployee.fullName}" will be permanently removed from the system.` : ""}
                onConfirm={handleDeleteEmployee}
                onCancel={() => setDeletingEmployee(null)}
                loading={removingEmployee}
            />
        </motion.section>
    );
};

export default DepartmentsDetails;
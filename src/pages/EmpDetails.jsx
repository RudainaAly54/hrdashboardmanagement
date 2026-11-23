import { usePreferences } from "../context/PreferencesContext"
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGetEmployeeByIdQuery, useDeleteEmployeeMutation } from '../store/employeesApi'
import { useToast } from "../context/ToastContext";
import EmployeeFormModal from "../components/EmployeeFormModal";
import NoFound from "./NoFound";
import ConfirmDialog from "../components/CofirmDialog";
import { FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import SkeletonLoader from "../components/SkeletonLoader";

const EmpDetails = () => {
    const { t } = usePreferences()
    const {id} = useParams();
    const navigate = useNavigate();
    const {showToast} = useToast();
    

const [isEditOpen, setIsEditOpen]  = useState(false)
const [isDeleteOpen, setIsDeleteOpen] = useState(false)
const [deleting, setDeleting] = useState(false);


const { data: employee, isLoading: loading, error, refetch } = useGetEmployeeByIdQuery(id);
  const message = error;
 const [removeEmployee] = useDeleteEmployeeMutation();


const handleUpdate = () => {
    setIsEditOpen(false);
   refetch();
    showToast("Employee updated successfully", "success")
}

const handleDelete = async () => {
    setDeleting(true)
    try {
        await removeEmployee(id).unwrap();
        showToast("Employee removed", "success")
        navigate("/employees")
    } catch (err) {
        console.error("Error deleting employee", err)
        showToast(err.message || "Could npt remove this employee.", "error")
    } finally {
        setDeleting(false)
    }
}


if (loading) return <SkeletonLoader />;

if (message) {
    return (
        <div className="p-6">
            <p className="text-red-600 bg-red-50 rounded-lg p-4">{message}</p>
            <button onClick={() => navigate("/employees")} className="mt-4 text-sm text-[#639987] hover:underline">
                ← Back to Employees
            </button>
        </div>
    );
}

if (!employee) return <NoFound />;
return (
    <motion.section 
    initial = {{opacity: 0, y: 10}}
    animate = {{opacity: 1, y:0}}
    transition={{duration: 0.3}}
    className="flex flex-col w-full h-ufll p-6 gap-5"
    >
        <div className="flex items-center justify-between flex-wrap gap-4">
            <button
            onClick={() => navigate("/employees")}
            className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
                 <FiArrowLeft size={16}/> <p>{t("emp.back")}</p>
            </button>

            <div className="flex gap-3">
                <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  <FiEdit2 size={14} /> {t("common.edit")}
                </button>

                <button 
                onClick={() => setIsDeleteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >

                      <FiTrash2 size={14} /> {t("common.delete")}
                </button>
            </div>
        </div>

        {/* Profile header */}
        <div
        className="bf-white border border-gray-200 rounded-xl p-6 flex items-center gap-5 flex-wrap"
        >

            <img 
            src={employee.PhotoUrl}
            alt={employee.fullName} 
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold font-[manrope]">
                        {employee.fullName}
                    </h1>
                </div>

                <p className="text-gray-500 text-sm mt-1">{employee.role}</p>
                <p className="text-sm text-gray-400 mt-1">{t("emp.id")}: {employee.id}</p>
            </div>
        </div>

        {/* Details Card */}
        <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="bg-white border-gray-200 rounded-xl p-4  flex flex-col items-start gap-1">
                
                    <p className="text-sm text-gray-500 uppercase">{t("common.email")}</p>
                    <p className="text-sm font-medium break-all">{employee.email}</p>
            </div>
        
            <div className="bg-white border-gray-200 rounded-xl p-4  flex flex-col items-start gap-1">
                    <p className="text-sm text-gray-500 uppercase">{t("common.department")}</p>
                    <p className="text-sm font-medium break-all">{employee.deptName}</p>
            </div>
        
            <div className="bg-white border-gray-200 rounded-xl p-4  flex flex-col items-start gap-3">
                
                    <p className="text-sm text-gray-500 uppercase">{t("common.city")}</p>
                    <p className="text-sm font-medium break-all">{employee.city}</p>
               
            </div>
        
            <div className="bg-white border-gray-200 rounded-xl p-4  flex flex-col items-start gap-3">
                
                    <p className="text-sm text-gray-500 uppercase">{t("common.joinDate")}</p>
                    <p className="text-sm font-medium break-all">
                        {employee.joinDate ? 
                    new Date(employee.joinDate).toLocaleDateString("en-US", 
                        {month: 'long', day:'numeric', year: 'numeric'} 
                    )     : "-"
                    }
                    </p>
               
            </div>
        
            <div className="bg-white border-gray-200 rounded-xl p-4  flex flex-col items-start gap-3">
               
                    <p className="text-sm text-gray-500 uppercase">{t("common.salary")}</p>
                    <p className="text-sm font-medium break-all">
                     {Number(employee.salary).toLocaleString(undefined, 
                        {style: "currency", currency: 'EGP', maximumFractionDigits: 0}
                     )}
                    </p>
               
            </div>

               <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-start gap-3">
                  
                        <p className="text-xs text-gray-500 uppercase">{t("common.netSalary")}</p>
                        <p className="text-sm font-medium">
                            {employee.netSalary != null
                                ? Number(employee.netSalary).toLocaleString(undefined, { style: "currency", currency: "EGP", maximumFractionDigits: 0 })
                                : "—"}
                            {employee.netSalaryPercent != null && (
                                <span className="text-xs text-gray-400 ml-1">({employee.netSalaryPercent}% of gross)</span>
                            )}
                        </p>
                    
                </div>
        </div>

        {/* FORM */}

        <EmployeeFormModal 
        mode = 'edit'
        isOpen={isEditOpen}
        employee={employee}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleUpdate}
        />

        <ConfirmDialog
        isOpen={isDeleteOpen}
        title={t("emp.deleteTitle")}
        message={`"${employee.fullName}" will be permanently removed from the system `}
        onConfirm={handleDelete}
        onCancel = {() => setIsDeleteOpen(false)}
        loading={deleting}
        />
    </motion.section>
)
}

export default EmpDetails
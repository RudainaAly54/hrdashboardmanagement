import {useState, useEffect, useCallback, use} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { departmentCRUD, employeeCRUD } from '../api/api';
import {useToast} from "../context/ToastContext"
import statusBadge from '../components/StatusBadge'
import IconsComp from '../components/IconsComp';
import DeparmentModal from '../components/DepartmentModal';
import EmployeeFormModal from '../components/EmployeeFormModal';
import ConfirmDialog from '../components/CofirmDialog';
import { FiArrowLeft, FiEdit2, FiTrash2, FiUsers, FiDollarSign } from "react-icons/fi";
import { BsThreeDotsVertical } from "react-icons/bs";
import LoadingSpinner from '../components/LoadingSpinner'

const DepartmentDetails = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {showToast} = useToast();

    const [department, setDepartment] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [isEditDeptOpen, setIsEditDeptOpen] = useState(false)
    const [isDeleteDeptOpen, setIsDeleteDeptopen ] = useState(false);
    const [deletingDept, setDeletingDept] = useState (false);
    
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [removingEmployee, setRemovingEmployee] = useState(false);

    //Emps => dept
    const loadData = useCallback(async () => {
        setLoading(true)
        setMessage("")
        
        try {
            const  dept = await departmentCRUD.getById(id);
            setDepartment(dept);

            const staff = await employeeCRUD.getAll({
                filters: {deptName: dept.deptName},
                orderBy: "fullName",
            });
            setEmployees(staff)
        }catch (error) {
            console.error("Error loading department", error)
            setMessage(error.message || "Could not load this department")
        } finally {
            setLoading(false)
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalSalary = employees.reduce((sum , emp) => sum + (Number(emp.salary) || 0, 0));

    const activeCount = employees.filter(e => e.status === "Active").length


    //Department
    const handleDeptUpadated = () => {
        setIsEditDeptOpen(false)
        loadData();
        showToast("Department updated successfully", "success")
    }

    //handle delete 
    const handleDeleteDept = async () => {
        setDeletingDept(true); 
        try{ 
            await departmentCRUD.remove(id);
            showToast("Department deleted", "success")
            navigate("/departments")
        } catch (err) {
            console.error("Error Deleting department", err)
            showToast(err.message|| "Could not delete this deparment", "error")
        } finally{
            setDeletingDept(false)
            setIsDeleteDeptopen(false)
        }
    };


    //Employees
    const handleEmployeeUpdated = ()=>  {
          setEditingEmployee(null);
        loadData();
        showToast("Employee updated successfully!", "success");
    }

    const  handleDeleteEmployee  = async () => {
        setRemovingEmployee(true);
        try {
            await employeeCRUD.remove(deletingEmployee.id);
            showToast("Employee removed", 'success')
            loadData()
        } catch (err) {
            console.error("Error removing employees", err)
            showToast(err.message || "Could not remove employee", "error")
        } finally{
            setRemovingEmployee(false)
            setDeletingEmployee(null)
        }
    };


    if(loading) {
        return <LoadingSpinner/>
    }

    if(message || !department) {
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
            <div className="p-6">
                <p className="text-red-600 bg-red-50 rounded-lg p-4">{message || "Department not found."}</p>
                <button onClick={() => navigate("/departments")} className="mt-4 text-sm text-[#639987] hover:underline">
                    ← Back to Departments
                </button>
            </div>
        );
}

export default DepartmentDetails
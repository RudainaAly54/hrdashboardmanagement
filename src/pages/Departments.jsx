import {useState, useMemo} from 'react'
import { motion } from 'framer-motion'
import { useOutletContext, useNavigate, useParams} from 'react-router-dom'
import {departmentCRUD} from '../api/api'
import {useAsync} from '../Hooks/useAsync'
import { FiPlus, FiFilter } from "react-icons/fi";
import { HiOutlineUsers } from "react-icons/hi2";
import IconsComp from '../components/IconsComp'



const Departments = () => {
const {search} = useOutletContext() 
const navigate = useNavigate();
const {id} = useParams()
const {data: departments, loading, error} = useAsync(

    () => 
        departmentCRUD.getAll({
            orderBy: "DeptName", 
            selectQuery: "*, Employees:headID(fullName, PhotoUrl)",
        }), [])

        //Filtering 
        const filteredDepartments = useMemo(() => {
            if(!departments) return [];
            if(!search) return departments;
            return departments.filter((d) => 
            d.DeptName.toLowerCase().includes(search.toLowerCase())
            );
        }, [departments, search])

        //get active manager accounts
        const activeManagerCount = filteredDepartments.filter((d) => d.Employees).length;


    return (
     <motion.section
     initial = {{opacity: 0, y: 10}}
     animate = {{opacity: 1, y: 0}}
     transition={{duration: 0.3}}
     className='flex flex-col w-full h-full p-6 gap-5'
     >

        <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
                <h1 className='text-2xl font-bold font-[manrope]'>Organization Units</h1>
                <p className='text-gray-500 text-sm'>
                    Manage departmental hierarchies and team distibution across the enterprise.
                </p>
            </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-[#639987] text-[#F9F9F8] rounded-lg text-sm font-medium hover:bg-[#557f70] transition">
                    <FiPlus size={16} /> Create Department
                </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                        <FiFilter size={14} /> Filter
                    </button>
                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                        Sort: Alphabetical
                    </button>
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
        <p className='text-gray-400 col-span-full tect-center py-8'>Loading Departments ...</p>
    ) :   filteredDepartments.length === 0 ?(
        <p className='text-gray-400 col-span-full text-center py-8'>No departements found.</p>
        ) : (
filteredDepartments.map((dept) => (
    <div
    key={dept.id}
    className='bg-white border border-gray-200 rounded-xl p-5 flex-col '
    >
        <div className='flex items-center justify-between mb-5'>
            <div className='w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-lg'>
                {<IconsComp  iconName={dept.Icon} className = 'text-[#639987]'  size = {20}/> || <HiOutlineUsers className='text-[#639987]' size={20}/> }
            </div>
            <span className='px-3 py-1 rounded-full bg-[#639987]/10 text-[#639987] text-sm font-medium'>
            {dept.core}
            </span>
        </div>

        <div className='mb-5'>
            <h3 className='font-semibold text-lg'>{dept.DeptName}</h3>
            <p className='text-sm text-gray-500 flex items-center gap-1'>
                <HiOutlineUsers size={14}/> {dept.NoEmployees} Employees
            </p>
        </div>

        <div className='flex items-center gap-2 pt-3 border-t'>
            <img  className='w-10l h-10 rounded-full'
            src =  {dept.Employees?.PhotoUrl}
            alt= {dept.Employees?.fullName} />

            <div className='w-full flex justify-between'>
                <div><p className='text-xs text-gray-400'>Head of Dept.</p>
              <p className='text-sm font-medium'>{dept.Employees.fullName ?? "Unassigned"}</p>
              </div>

                <div className='flex gap-5'>
           <button className='w-16 h-10 text-[#F9F9F8] bg-[#699378] rounded-lg'
               onClick = {() => navigate("/departments/deptDetails/:id")}
           >
            Details
            </button>
           <button className='w-16 h-10 text-[#F9F9F8] bg-red-500 rounded-lg'>
            Delete
            </button>
     </div>
            </div>
        </div>
   
    </div>
))
        )}
</div>

     </motion.section>
    )
}
export default Departments
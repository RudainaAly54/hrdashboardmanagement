import { useState, useEffect } from "react";
import { leaveRequestCRUD } from "../api/api";
import { createClient } from "../lib/supabaseClient";
import FormModal from './FormModal'
import { create, div, label, span } from "framer-motion/m";
import { data } from "autoprefixer";

const supabase = createClient()
const LEAVE_TYPES = ["Vecation", "Sick leave", "Personal", "Remote", "Other"]


const LeaveRequestFormModal = ({isOpen, onClose, onSuccess}) => {
    const [employees, setEmployees] = useState([])
     useEffect(()=> {
        if(!isOpen) return
        supabase.from("Employees")
        .select("id, fullName, deptName")
        .order('fullName')
        .then(({data}) => setEmployees(data || []))
     }, [isOpen])

     const initialValues = {
        empoyeeId: "",
        leaveType: LEAVE_TYPES[0],
        startDate: new Date().toISOString().slice(0,10),
        endDate: new Date().toISOString().slice(0,10),
        reason: "",
        urgent: "false"
     }

     const fields = [
        {name: "employeeId", lable: "Employee", type: "select", requird: true, span: 2,
            options: employees.map(e =>( {value:e.id, label:`${e.fullName} - ${e.deptName}` })),
        },
        {name: "leaveType", label: "Leave Type", type: "select", options: LEAVE_TYPES},
        {name: "urgent", label: "Priority", type: "select", 
            options: [{value: "false", label: "Normal"},  {value: "true", label: "Urgent"}]
        },
        {name: "startDate", label: "Start Date", type: "date", requird: true },
        {name: "endDate", label: "End Date", type:"date", requird: true },
        {
            name: "reason", type: "custom", span: 2,
            render: (values, update) => (
                <div>
                    <label className="text-sm text-gray-500 ">REASON</label>
                    <textarea 
                    value={values.reason ?? ""}
                    onChange={update("reason")}
                    rows={3}
                    placeholder="Brief reason for the leave request...."
                    className="w-full mt-1 px-3 py-2 border  border-gray-200 rounded-lg text-sm resize-none"
                    name="" id=""></textarea>
                </div>
            )
        }
     ]

     const handleSubmit = async (values) => {
        if(new Date(values.endDate) < new Date(values.startDate)){
            throw new Error("End date can't be before the start date")
        }

        await leaveRequestCRUD.create({
            employeeId: values.employeeId, 
            leaveType: values.leaveType, 
            startDate: values.startDate, 
            endDate: values.endDate,
            reason: values.reason?.trim() || null,
            urgent: values.urgent === "true",
            status: "pending"
        })
        onSuccess()
     }

     return(
        <FormModal
        isOpen={isOpen}
        title = {"New Leave Request"}
        initialValues={initialValues}
        fields={fields}
        onSubmit={handleSubmit}
        onClose={onClose}
        submitLabel="Submit Request...."
        savingLabel="Submitting....."
        />
     )
}

export default LeaveRequestFormModal
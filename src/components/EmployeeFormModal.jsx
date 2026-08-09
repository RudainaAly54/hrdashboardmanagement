import { employeeCRUD } from "../api/api";
import {pickAvatarUrl} from '../lib/pickAvatarUrl'
import { createClient } from "../lib/supabaseClient";
import FormModal from "./FormModal";

const supabase = createClient();

const TABLE_NAME = "Employees"
const DEPARTMENTS = [
    { prefix: "ACC", name: "Accounting" },
    { prefix: "AI", name: "Artificial Intelligence" },
    { prefix: "CLD", name: "Cloud Infrastructure" },
    { prefix: "CS", name: "Customer Support" },
    { prefix: "SEC", name: "Cybersecurity" },
    { prefix: "DE", name: "Data Engineering" },
    { prefix: "FIN", name: "Finance" },
    { prefix: "HR", name: "Human Resources" },
    { prefix: "ITI", name: "IT Infrastructure" },
    { prefix: "LGL", name: "Legal" },
    { prefix: "LOG", name: "Logistics" },
    { prefix: "MKT", name: "Marketing" },
    { prefix: "MOB", name: "Mobile Development" },
    { prefix: "OPS", name: "Operations" },
    { prefix: "PRC", name: "Procurement" },
    { prefix: "PM", name: "Product Management" },
    { prefix: "QA", name: "Quality Assurance" },
    { prefix: "SLS", name: "Sales" },
    { prefix: "SW", name: "Software Engineering" },
];

const CITIES = ["Cairo", "Giza", "Alexandria", "Tanta", "Mansoura", "Ismailia", "Suez", "Port Said", "Luxor", "Aswan"];
const STATUS_OPTIONS = ["Active", "On Leave", "Terminated", "Remote"];

//ID generation 
const generateNextId = async (prefix) => {
    const {data, error} = await supabase
    .from(TABLE_NAME)
    .select("id")
    .ilike("id", `${prefix}-%`)

    if(error) throw error
    
    let maxNum = 1000;
    for(const row of data || []) {
        const num = parseInt(row.id.split("-")[1], 10);
        if(!Number.isNaN(num) && num > maxNum) maxNum = num
    }
    return `${prefix}-${maxNum+1}`



}

const EmployeeFormModal = ( { 
     isOpen, mode = "create", 
    employee, onClose, onSuccess
}) => {

    const isEdit = mode === 'edit';


    const initialValues = isEdit ? 
    {
        fullName: employee?.fullName ||"",
        role: employee?.role || "",
        city: employee?.city || CITIES[0],
        status: employee?.status || STATUS_OPTIONS[0],
        salary: employee?.salary ?? "",
    } : {
        fullName: "",
        email: "",
        gender: "Male",
        deptName: DEPARTMENTS[0].name,
        role: "",
        city: CITIES[0],
        status: "Active", 
        joinDate: new Date().toISOString().slice(0,10),
        salary: ""
    }


    const fields = isEdit ? [
         { name: "fullName", label: "Full Name", required: true, span: 2 },
              { name: "role", label: "Role", required: true, span: 2 },
              { name: "city", label: "City", type: "select", options: CITIES },
              { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
              { name: "salary", label: "Salary", type: "number", min: "0", step: "0.01", required: true, span: 2 },
    ] : [
            { name: "fullName", label: "Full Name", required: true, span: 2, placeholder: "e.g. Sara Kamal" },
              { name: "email", label: "Email", type: "email", required: true, span: 2, placeholder: "name@hrelevate.com" },
              { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
              {
                  name: "deptName",
                  label: "Department",
                  type: "select",
                  options: DEPARTMENTS.map((d) => ({ value: d.name, label: d.name })),
              },
              { name: "role", label: "Role", required: true, span: 2, placeholder: "e.g. Software Architect" },
              { name: "city", label: "City", type: "select", options: CITIES },
              { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
              { name: "joinDate", label: "Join Date", type: "date" },
              { name: "salary", label: "Salary", type: "number", min: "0", step: "0.01", required: true, placeholder: "e.g. 25000" },
    ];

    const handleSubmit = async (values) => {
        if(isEdit) {
            await employeeCRUD.update(employee.id, {
                fullName: values.fullName.trim(),
                role: values.role.trim(),
                city: values.city,
                status: values.status,
                salary: parseFloat(values.salary)
            });
        } else {
            const dept = DEPARTMENTS.find(d => d.name === values.deptName);
            const id = await generateNextId(dept.prefix);
            const photoUrl = pickAvatarUrl(values.email || values.fullName, values.gender);

            await employeeCRUD.create({
                id, 
                fullName: values.fullName.trim(),
                email: values.email.trim(),
            deptName: values.deptName.trim(),
            status: values.status,
            joinDate: values.joinDate, 
            role: values.role.trim(),
            city: values.city, 
            salary: parseFloat(values.salary),
            PhotoUrl: photoUrl
            });
        }

        onSuccess();
    }

    return (
        <FormModal
        isOpen={isOpen}
         title={isEdit ? "Edit Employee" : "Add Employee"}
            fields={fields}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onClose={onClose}
            submitLabel={isEdit ? "Save Changes" : "Add Employee"}
            savingLabel={isEdit ? "Saving..." : "Adding..."}
        />
    )
}

export default EmployeeFormModal
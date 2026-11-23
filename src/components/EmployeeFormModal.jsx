import { useCreateEmployeeMutation, useUpdateEmployeeMutation } from "../store/employeesApi";
import { useGetDepartmentsQuery } from "../store/departmentsApi";
import { pickAvatarUrl } from "../lib/pickAvatarUrl";
import { createClient } from "../lib/supabaseClient";
import FormModal from "./FormModal";

const supabase = createClient();

const TABLE_NAME = "Employees";
const CITIES = ["Cairo", "Giza", "Alexandria", "Tanta", "Mansoura", "Ismailia", "Suez", "Port Said", "Luxor", "Aswan"];
const STATUS_OPTIONS = ["Active", "On Leave", "Terminated", "Remote"];

// ID generation
const generateNextId = async (prefix) => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("id")
        .ilike("id", `${prefix}-%`);

    if (error) throw error;

    let maxNum = 1000;
    for (const row of data || []) {
        const num = parseInt(row.id.split("-")[1], 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
    }
    return `${prefix}-${maxNum + 1}`;
};

const EmployeeFormModal = ({ isOpen, mode = "create", employee, onClose, onSuccess }) => {
    const isEdit = mode === "edit";
    const [createEmployee] = useCreateEmployeeMutation();
    const [updateEmployee] = useUpdateEmployeeMutation();
    const { data: departments = [] } = useGetDepartmentsQuery();

    const deptOptions = departments.map((d) => ({ value: d.DeptName, label: d.DeptName }));

    const initialValues = isEdit
        ? {
              fullName: employee?.fullName || "",
              role: employee?.role || "",
              city: employee?.city || CITIES[0],
              status: employee?.status || STATUS_OPTIONS[0],
              salary: employee?.salary ?? "",
              netSalaryPercent: employee?.netSalaryPercent ?? "100",
          }
        : {
              fullName: "",
              email: "",
              gender: "Male",
              deptName: deptOptions[0]?.value ?? "",
              role: "",
              city: CITIES[0],
              status: "Active",
              joinDate: new Date().toISOString().slice(0, 10),
              salary: "",
              netSalaryPercent: "100",
          };

    const netSalaryFields = [
        { name: "netSalaryPercent", label: "Net Salary %", type: "number", min: "0", max: "100", step: "0.1", required: true, placeholder: "e.g. 85" },
        {
            name: "netSalaryPreview",
            type: "custom",
            span: 2,
            render: (values) => {
                const gross = parseFloat(values.salary) || 0;
                const pct = parseFloat(values.netSalaryPercent);
                const validPct = Number.isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
                const net = gross - gross * (validPct / 100);
                return (
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Net Salary (calculated)</p>
                        <p className="text-sm font-semibold text-[#639987]">
                            {net.toLocaleString(undefined, { style: "currency", currency: "EGP", maximumFractionDigits: 0 })}
                        </p>
                    </div>
                );
            },
        },
    ];

    const fields = isEdit
        ? [
              { name: "fullName", label: "Full Name", required: true, span: 2 },
              { name: "role", label: "Role", required: true, span: 2 },
              { name: "city", label: "City", type: "select", options: CITIES },
              { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
              { name: "salary", label: "Salary", type: "number", min: "0", step: "0.01", required: true, span: 2 },
              ...netSalaryFields,
          ]
        : [
              { name: "fullName", label: "Full Name", required: true, span: 2, placeholder: "e.g. Sara Kamal" },
              { name: "email", label: "Email", type: "email", required: true, span: 2, placeholder: "name@hrelevate.com" },
              { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
              { name: "deptName", label: "Department", type: "select", options: deptOptions },
              { name: "role", label: "Role", required: true, span: 2, placeholder: "e.g. Software Architect" },
              { name: "city", label: "City", type: "select", options: CITIES },
              { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
              { name: "joinDate", label: "Join Date", type: "date" },
              { name: "salary", label: "Salary", type: "number", min: "0", step: "0.01", required: true, placeholder: "e.g. 25000" },
              ...netSalaryFields,
          ];

    const handleSubmit = async (values) => {
        const grossSalary = parseFloat(values.salary);
        const netPercent = Math.min(100, Math.max(0, parseFloat(values.netSalaryPercent) || 0));
        const netSalary = grossSalary - grossSalary * (netPercent / 100);

        if (isEdit) {
            await updateEmployee({
                id: employee.id,
                payload: {
                    fullName: values.fullName.trim(),
                    role: values.role.trim(),
                    city: values.city,
                    status: values.status,
                    salary: grossSalary,
                    netSalaryPercent: netPercent,
                    netSalary,
                },
            }).unwrap();
        } else {
            const dept = departments.find((d) => d.DeptName === values.deptName);
            if (!dept?.prefix) throw new Error("This department has no ID prefix");

            const id = await generateNextId(dept.prefix);
            const photoUrl = pickAvatarUrl(values.email || values.fullName, values.gender);

            await createEmployee({
                id,
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                deptName: values.deptName.trim(),
                DeptId: dept.id,
                status: values.status,
                joinDate: values.joinDate,
                role: values.role.trim(),
                city: values.city,
                salary: grossSalary,
                netSalaryPercent: netPercent,
                netSalary,
                PhotoUrl: photoUrl,
            }).unwrap();
        }

        onSuccess();
    };

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
    );
};

export default EmployeeFormModal;
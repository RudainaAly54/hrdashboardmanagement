import { useState, useEffect } from "react";
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from "../store/departmentsApi"
import { createClient } from "../lib/supabaseClient"
import IconsComp from "./IconsComp"
import FormModal from "./FormModal";

const supabase = createClient();


const CATEGORY_OPTIONS = ["Technical", "Business", "Operations", "Revenue", "Creative", "Strategic", "Success"];

const DepartmentModal = ({
    isOpen, mode = "create",
    initialData, onClose, onSuccess
}) => {

    const isEdit = mode === "edit";

    const [createDepartment] = useCreateDepartmentMutation();
    const [updateDepartment] = useUpdateDepartmentMutation();

    const [employees, setEmployees] = useState([]);

    // Head-of-department candidates must already belong to THIS department —
    // only meaningful in edit mode, since a brand-new department has no
    // members yet (nobody can be "head of" a department that doesn't exist).
    useEffect(() => {
        if (!isOpen || !isEdit || !initialData?.DeptName) {
            setEmployees([]);
            return;
        }
        supabase.from("Employees")
            .select("id, fullName")
            .eq("deptName", initialData.DeptName)
            .order("fullName")
            .then(({ data }) => setEmployees(data || []));
    }, [isOpen, isEdit, initialData]);

    const initialValues = isEdit ?
        {
            DeptName: initialData?.DeptName || "",
            core: initialData?.core || CATEGORY_OPTIONS[0],
            prefix: initialData?.prefix || "", 
            headID: initialData?.headID || "",
        } : {
            DeptName: "",
            core: CATEGORY_OPTIONS[0],
            prefix: "", 
            headID: ""
        }

    //Fields
    const fields = [
        { name: "DeptName", label: 'Department Name', required: true, span: 2, placeholder: "e.g. Data Engineering" },
        { name: "prefix", label: 'ID Prefix', required: true,  placeholder: "e.g. SW" },
        { name: "core", label: "Category", type: "select", options: CATEGORY_OPTIONS },
      
        isEdit
            ? {
                  name: "headID", label: "Head of the Department", type: "select", span: 2,
                  includeEmpty: true, emptyLabel: "Unassigned",
                  options: employees.map(emp => ({ value: emp.id, label: emp.fullName })),
              }
            : {
                  name: "headNote", type: "custom", span: 2,
                  render: () => (
                      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                          You can assign a Head of Department after this department has been created and employees have joined it.
                      </p>
                  ),
              },
    ];

    // handle submit
    const handleSubmit = async (values) => {
        const payload = {
            DeptName: values.DeptName.trim(),
            prefix: values.prefix.trim().toUpperCase(),
            core: values.core,
            headID: isEdit ? (values.headID || null) : null,
        };

        if (isEdit) {
            await updateDepartment({ id: initialData.id, payload }).unwrap();
        } else {
            await createDepartment({ ...payload, NoEmployees: 0 }).unwrap();
        }
        onSuccess();
    }

    return (
        <FormModal
            isOpen={isOpen}
            title={isEdit ? "Edit Department" : "Create Department"}
            fields={fields}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onClose={onClose}
            submitLabel={isEdit ? "Save Changes" : "Create Department"}
            savingLabel="Saving..."
        />
    )
}

export default DepartmentModal
import { useState, useEffect } from "react";
import { departmentCRUD } from "../api/api"
import { createClient } from "../lib/supabaseClient"
import IconsComp from "./IconsComp"
import FormModal from "./FormModal";

const supabase = createClient();

const ICON_OPTIONS = [
    "brain-circuit", "code-2", "layout-dashboard", "database", "shield-check",
    "smartphone", "cloud", "server", "truck", "shopping-cart", "scale", "megaphone",
];

const CATEGORY_OPTIONS = ["Technical", "Business", "Operations", "Revenue", "Creative", "Strategic", "Success"];

const DepartmentModal = ({
    isOpen, mode = "create",
    initialData, onClose, onSuccess
}) => {

    const isEdit = mode === "edit";

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
            Icon: initialData?.Icon || ICON_OPTIONS[0],
            headID: initialData?.headID || "",
        } : {
            DeptName: "",
            core: CATEGORY_OPTIONS[0],
            Icon: ICON_OPTIONS[0],
            headID: ""
        }

    //Fields
    const fields = [
        { name: "DeptName", label: 'Department Name', required: true, span: 2, placeholder: "e.g. Data Engineering" },
        { name: "core", label: "Category", type: "select", options: CATEGORY_OPTIONS },
        { name: "Icon", label: "Icon", type: "select", options: ICON_OPTIONS },
        {
            name: "iconPreview", type: "custom", span: 2,
            render: (values) => (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center">
                        <IconsComp iconName={values.Icon} className="text-[#639987]" size={20} />
                    </div>
                    <p className="text-sm text-gray-500">Icon preview</p>
                </div>
            )
        },
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
            core: values.core,
            Icon: values.Icon,
            headID: isEdit ? (values.headID || null) : null,
        };

        if (isEdit) {
            await departmentCRUD.update(initialData.id, payload);
        } else {
            await departmentCRUD.create({ ...payload, NoEmployees: 0 });
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
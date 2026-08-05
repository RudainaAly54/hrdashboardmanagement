import { useState, useEffect } from "react"
import { FiX } from "react-icons/fi";
import { createClient } from "../lib/supabaseClient";
import { pickAvatarUrl } from "../lib/pickAvatarUrl"

const supabase = createClient()
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

const emptyForm = {
    fullName: "",
    email: "",
    gender: "Male",
    deptName: DEPARTMENTS[0].name,
    role: "",
    city: CITIES[0],
    status: "Active",
    joinDate: new Date().toISOString().slice(0, 10),
    salary: "",
};

// Builds form state from an existing employee row (handles date formatting, null salary, etc.)
const formFromEmployee = (employee) => ({
    fullName: employee?.fullName ?? "",
    email: employee?.email ?? "",
    gender: employee?.gender ?? "Male",
    deptName: employee?.deptName ?? DEPARTMENTS[0].name,
    role: employee?.role ?? "",
    city: employee?.city ?? CITIES[0],
    status: employee?.status ?? "Active",
    joinDate: employee?.joinDate ? String(employee.joinDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    salary: employee?.salary != null ? String(employee.salary) : "",
});

const EditEmployeeModal = ({ isOpen, employee, onClose, onSuccess }) => {
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    // Re-sync the form whenever a new employee is passed in (e.g. clicking Edit on a different row)
    useEffect(() => {
        if (employee) {
            setForm(formFromEmployee(employee));
            setError("");
        }
    }, [employee]);

    if (!isOpen || !employee) return null

    const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.fullName.trim() || !form.email.trim() || !form.salary || !form.role.trim()) {
            setError("Full Name, Email, Role and Salary are required");
            return;
        }

        setSaving(true)

        try {
            // Only regenerate the avatar if email or gender actually changed —
            // otherwise keep the existing PhotoUrl so we don't churn avatars on every edit.
            const photoUrl =
                form.email.trim() !== employee.email || form.gender !== employee.gender
                    ? pickAvatarUrl(form.email || form.fullName, form.gender)
                    : employee.PhotoUrl;

            const updatedFields = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                deptName: form.deptName.trim(),
                status: form.status.trim(),
                joinDate: form.joinDate.trim(),
                role: form.role.trim(),
                city: form.city.trim(),
                salary: parseFloat(form.salary),
                PhotoUrl: photoUrl,
            };

            const { data, error: updateError } = await supabase
                .from(TABLE_NAME)
                .update(updatedFields)
                .eq('id', employee.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Prefer the row Supabase actually saved; fall back to a locally-built object
            // in case .select() is blocked by a policy but the update itself succeeded.
            onSuccess(data ?? { ...employee, ...updatedFields });
        } catch (err) {
            console.error("Error updating employee:", err);
            setError(err.message || "Something went wrong while updating the employee.");
        } finally {
            setSaving(false);
        }
    }

    const handleClose = () => {
        if (saving) return;
        setError("");
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold font-[manrope]">Edit Employee</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 uppercase">Full Name</label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={update("fullName")}
                                placeholder="e.g. Sara Kamal"
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 uppercase">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={update("email")}
                                placeholder="name@hrelevate.com"
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase">Gender</label>
                            <select
                                value={form.gender}
                                onChange={update("gender")}
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase">Department</label>
                            <select
                                value={form.deptName}
                                onChange={update("deptName")}
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            >
                                {DEPARTMENTS.map((d) => (
                                    <option key={d.prefix} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="text-xs text-gray-500 uppercase">Role</label>
                            <input
                                type="text"
                                value={form.role}
                                onChange={update("role")}
                                placeholder="e.g. Software Architect"
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase">City</label>
                            <select
                                value={form.city}
                                onChange={update("city")}
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            >
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase">Status</label>
                            <select
                                value={form.status}
                                onChange={update("status")}
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            >
                                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase">Join Date</label>
                            <input
                                type="date"
                                value={form.joinDate}
                                onChange={update("joinDate")}
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase">Salary</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.salary}
                                onChange={update("salary")}
                                placeholder="e.g. 25000"
                                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm bg-[#639987] text-[#F9F9F8] rounded-lg hover:bg-[#557f70] disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditEmployeeModal
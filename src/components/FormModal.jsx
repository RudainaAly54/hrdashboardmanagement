/* Field
{
name : "fullName",
label: "Full Name"
type: "text" | "email" | "number" | ....| ...
span: 2                    // Optional - makes the field take both grid col
required: true        //Optional
placeholder: "......"   //Optional

options : [ ..... ]        //Required ("select") => array or [key: value]
includeEmpty: true //Optional ("select") => adds a blank/unassigned option
emptyLabel: "unassigned"
render: (values, update) => <jsx/> //required for custom
}
*/

import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const FormModal = ({
    isOpen,
    title,
    fields,
    initialValues,
    onSubmit,
    onClose,
    submitLabel = "Save",
    savingLabel = "Saving ...",
    maxWidth = "max-w-lg"
}) => {
    const [values, setValues] = useState({})
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    //create => empty initial values
    //edit => prefilled initial values
    useEffect(() => {
        if (isOpen) {
            setValues(initialValues || {});
            setError("")
        }
    }, [isOpen, initialValues])

    if (!isOpen) return null;

    const update = (name) => e => setValues((prev) => ({ ...prev, [name]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const missing = fields.filter(
            f => f.required && !String(values[f.name] ?? "").trim()
        );

        if (missing.length > 0) {
            setError(`${missing.map(f => f.label).join(", ")} ${missing.length > 1 ? "are" : "is"} required.`);
            return
        }

        setSaving(true)

        try {
            await onSubmit(values)
        } catch (err) {
            console.error("Form submit error: ", err)
            setError(err.message || "Something went wrong, please try again.");
        } finally {
            setSaving(false)
        }
    };

    const handleClose = () => {
        if (saving) return //don't let the modal close mid save
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-xl shadow-lg w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold font-[manrope]">{title}</h2>
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
                        {fields.map((field) => (
                            <div key={field.name} className={field.span === 2 ? "col-span-2" : ""}>
                                {field.type !== "custom" && (
                                    <label className="text-xs text-gray-500 uppercase">{field.label}</label>
                                )}

                                {field.type === "select" ? (
                                    <select
                                        value={values[field.name] ?? ""}
                                        onChange={update(field.name)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        {field.includeEmpty && (
                                            <option value="">{field.emptyLabel || "None"}</option>
                                        )}
                                        {field.options.map((opt) => {
                                            const value = typeof opt === "object" ? opt.value : opt;
                                            const label = typeof opt === "object" ? opt.label : opt;
                                            return <option key={value} value={value}>{label}</option>;
                                        })}
                                    </select>
                                ) : field.type === "custom" ? (
                                    field.render(values, update)
                                ) : (
                                    <input
                                        type={field.type || "text"}
                                        value={values[field.name] ?? ""}
                                        onChange={update(field.name)}
                                        placeholder={field.placeholder}
                                        min={field.min}
                                        step={field.step}
                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                )}
                            </div>
                        ))}
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
                            {saving ? savingLabel : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormModal;
import { usePreferences } from "../context/PreferencesContext"
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiChevronDown, FiCheck } from "react-icons/fi";

const SelectField = ({ value, onChange, options, includeEmpty, emptyLabel }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const items = [
        ...(includeEmpty ? [{ value: "", label: emptyLabel || "None" }] : []),
        ...options.map((o) => (typeof o === "object" ? o : { value: o, label: o })),
    ];
    const current = items.find((i) => String(i.value) === String(value ?? ""));

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    return (
        <div ref={ref} className="relative mt-1">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-left"
            >
                <span className="truncate">{current?.label ?? items[0]?.label ?? "Select..."}</span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FiChevronDown size={16} className="text-gray-400" />
                </motion.span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{ transformOrigin: "top" }}
                        className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                    >
                        {items.map((item) => {
                            const selected = String(item.value) === String(value ?? "");
                            return (
                                <li
                                    key={String(item.value)}
                                    onClick={() => { onChange(item.value); setOpen(false); }}
                                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-[#f0f5f3] ${selected ? "text-[#639987] font-medium" : ""}`}
                                >
                                    <span className="truncate">{item.label}</span>
                                    {selected && <FiCheck size={14} />}
                                </li>
                            );
                        })}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

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
    const { t } = usePreferences()
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
                                    <SelectField
        value={values[field.name]}
        options={field.options}
        includeEmpty={field.includeEmpty}
        emptyLabel={field.emptyLabel}
        onChange={(v) => update(field.name)({ target: { value: v } })}
    />
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
                            {t("common.cancel")}
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
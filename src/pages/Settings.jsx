import { useState, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { useAsync } from "../Hooks/useAsync"
import { hrCRUD, settingsCRUD, employeeCRUD } from "../api/api"
import { useAuth } from "../context/AuthContext"
import { usePreferences, LANGUAGES } from "../context/PreferencesContext"
import { useToast } from "../context/ToastContext"
import FormModal from "../components/FormModal"
import ConfirmDialog from "../components/CofirmDialog"
import LoadingSpinner from "../components/LoadingSpinner"
import { FiMapPin, FiPlus, FiTrash2, FiCheckCircle, FiBell, FiDroplet } from "react-icons/fi"
import { HiOutlineSparkles } from "react-icons/hi2"

const TABS = ["company", "managers", "system"]
const MAX_LOGO_BYTES = 500 * 1024

const DEFAULTS = {
    companyName: "",
    taxId: "",
    website: "",
    headquarters: "",
    adminEmail: "",
    supportPhone: "",
    logoUrl: "",
    emailNotifications: true,
    slackIntegration: false,
    realtimePush: true,
}

const INVITE_INITIAL = { fullName: "", email: "", empID: "" }

const initials = (name = "") =>
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"

const inputCls =
    "w-full mt-1 px-3 py-2.5 bg-gray-100 border-b border-gray-300 rounded-t-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C3B9]"
const labelCls = "text-xs text-gray-500 uppercase tracking-wide"

const Card = ({ title, icon, children, className = "" }) => (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
            {icon && (
                <div className="w-10 h-10 rounded-xl bg-[#f0f5f3] flex items-center justify-center text-[#639987]">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold font-[manrope]">{title}</h3>
        </div>
        {children}
    </div>
)

const Toggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between gap-4">
        <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#639987] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
        </label>
    </div>
)

const Settings = () => {
    const { showToast } = useToast()
    const { hrProfile } = useAuth()
    const fileRef = useRef(null)
    const { t, theme, setTheme, language, setLanguage } = usePreferences()

    const [tab, setTab] = useState("company")
    const [form, setForm] = useState(null)
    const [saved, setSaved] = useState({ ...DEFAULTS, theme, language })
    const [saving, setSaving] = useState(false)
    const [settingsId, setSettingsId] = useState(null)

    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const { loading, error } = useAsync(async () => {
        const rows = await settingsCRUD.getAll({ orderBy: "id", selectQuery: "*" })
        const row = rows?.[0]
        const merged = { ...DEFAULTS, theme, language, ...Object.fromEntries(Object.entries(row || {}).filter(([k, v]) => k in DEFAULTS && v !== null)) }
        setSettingsId(row?.id ?? null)
        setSaved(merged)
        setForm(merged)
        return rows
    }, [])

    const { data: managers, loading: managersLoading, error: managersError, refetch: refetchManagers } = useAsync(
        () => hrCRUD.getAll({ orderBy: "fullName", selectQuery: "*, Employees:empID(deptName)" }),
        []
    )

    const { data: employeeOptions } = useAsync(
        () => employeeCRUD.getAll({ orderBy: "fullName", selectQuery: "id, fullName" }),
        []
    )

    const values = form || { ...DEFAULTS, theme, language }
    const isDirty = useMemo(() => form && JSON.stringify(form) !== JSON.stringify(saved), [form, saved])

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
    const setValue = (key, value) => setForm((f) => ({ ...f, [key]: value }))

    const handleLogo = (e) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        if (!file.type.startsWith("image/")) return showToast("Please choose an image file", "error")
        if (file.size > MAX_LOGO_BYTES) return showToast("Logo must be under 500 KB", "error")
        const reader = new FileReader()
        reader.onload = () => setValue("logoUrl", reader.result)
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { theme: nextTheme, language: nextLanguage, ...payload } = form
            const row = settingsId
                ? await settingsCRUD.update(settingsId, payload)
                : await settingsCRUD.create(payload)
            setSettingsId(row?.id ?? settingsId)
            setTheme(nextTheme)
            setLanguage(nextLanguage)
            setSaved(form)
            showToast("Settings saved successfully!", "success")
        } catch (err) {
            console.error("Error saving settings:", err)
            showToast(err.message || "Could not save settings", "error")
        } finally {
            setSaving(false)
        }
    }

    const inviteFields = [
        { name: "fullName", label: "Full Name", required: true, span: 2, placeholder: "e.g. Sara Kamal" },
        { name: "email", label: "Work Email", type: "email", required: true, span: 2, placeholder: "name@hrelevate.com" },
        {
            name: "empID", label: "Linked Employee", type: "select", span: 2,
            includeEmpty: true, emptyLabel: "Not linked",
            options: (employeeOptions || []).map((e) => ({ value: e.id, label: `${e.fullName} (${e.id})` })),
        },
    ]

    const handleInvite = async (v) => {
        await hrCRUD.create({
            fullName: v.fullName.trim(),
            email: v.email.trim(),
            empID: v.empID || null,
        })
        setIsInviteOpen(false)
        refetchManagers()
        showToast("HR manager added", "success")
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await hrCRUD.remove(deleteTarget.HRid, "HRid")
            showToast("HR manager removed", "success")
            refetchManagers()
        } catch (err) {
            console.error("Error removing HR manager:", err)
            showToast(err.message || "Could not remove this manager", "error")
        } finally {
            setDeleting(false)
            setDeleteTarget(null)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col max-w-full h-full p-6 gap-5"
        >
            <div>
                <h1 className="text-3xl font-bold font-[manrope]">{t("settings.title")}</h1>
                <p className="text-gray-500 text-sm">{t("settings.subtitle")}</p>
            </div>

            {error && (
                <p className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
                    Couldn't load saved settings ({error}). Showing defaults.
                </p>
            )}

            <div className="flex gap-8 border-b border-gray-200 overflow-x-auto">
                {TABS.map((key) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                            tab === key
                                ? "border-[#2f6555] text-[#2f6555] font-bold"
                                : "border-transparent text-gray-500 hover:text-[#2f6555]"
                        }`}
                    >
                        {t(`tab.${key}`)}
                    </button>
                ))}
            </div>

            {tab === "company" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 flex flex-col gap-5">
                        <Card title="General Information">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Company Legal Name</label>
                                    <input className={inputCls} value={values.companyName} onChange={set("companyName")} />
                                </div>
                                <div>
                                    <label className={labelCls}>Tax ID</label>
                                    <input className={inputCls} value={values.taxId} onChange={set("taxId")} />
                                </div>
                                <div>
                                    <label className={labelCls}>Website</label>
                                    <input className={inputCls} value={values.website} onChange={set("website")} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className={labelCls}>Primary Headquarters</label>
                                    <div className="relative">
                                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input className={`${inputCls} pl-10`} value={values.headquarters} onChange={set("headquarters")} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Contact Details">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelCls}>Admin Email</label>
                                    <input type="email" className={inputCls} value={values.adminEmail} onChange={set("adminEmail")} />
                                </div>
                                <div>
                                    <label className={labelCls}>Support Phone</label>
                                    <input type="tel" className={inputCls} value={values.supportPhone} onChange={set("supportPhone")} />
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-5">
                        <Card title="Brand Identity">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-32 h-32 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                    {values.logoUrl ? (
                                        <img src={values.logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-3xl font-bold text-[#639987]">{initials(values.companyName)}</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    Company Logo<br />250x250px Recommended
                                </p>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full py-2 border border-[#2f6555] text-[#2f6555] rounded-lg text-sm font-medium hover:bg-[#f0f5f3] transition"
                                >
                                    Replace Asset
                                </button>
                            </div>
                        </Card>

                        <div className="bg-[#497f6e] text-white rounded-xl p-6 flex gap-3">
                            <HiOutlineSparkles size={22} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Elite Dashboard Enabled</p>
                                <p className="text-sm text-white/85 mt-1">
                                    You are using the Enterprise Premium workspace. Custom CSS branding is available in advanced settings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === "managers" && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold font-[manrope]">Administrative Access</h3>
                        <button
                            onClick={() => setIsInviteOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#639987] text-[#F9F9F8] rounded-lg text-sm font-medium hover:bg-[#557f70] transition"
                        >
                            <FiPlus size={16} /> Invite Manager
                        </button>
                    </div>

                    {managersError && (
                        <p className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{managersError}</p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                                    <th className="p-4 font-medium">Manager</th>
                                    <th className="p-4 font-medium">Department</th>
                                    <th className="p-4 font-medium">Permission</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managersLoading ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading managers...</td></tr>
                                ) : !managers || managers.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No HR managers found</td></tr>
                                ) : (
                                    managers.map((m) => {
                                        const isSelf = hrProfile?.HRid === m.HRid
                                        return (
                                            <tr key={m.HRid} className="border-t border-gray-100 hover:bg-gray-50 transition">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#639987] text-white flex items-center justify-center font-bold text-sm">
                                                            {initials(m.fullName)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{m.fullName}{isSelf && <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>}</p>
                                                            <p className="text-xs text-gray-500">{m.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">{m.Employees?.deptName || "—"}</td>
                                                <td className="p-4">
                                                    <span className="px-3 py-1 rounded-full bg-[#639987]/15 text-[#2f6555] text-xs font-medium">HR Admin</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => setDeleteTarget(m)}
                                                        disabled={isSelf}
                                                        title={isSelf ? "You can't remove your own access" : "Remove manager"}
                                                        className="text-gray-400 hover:text-red-600 transition disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "system" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card title={t("system.comm")} icon={<FiBell size={20} />}>
                        <div className="flex flex-col gap-6">
                            <Toggle
                                label={t("system.email")}
                                description={t("system.emailDesc")}
                                checked={values.emailNotifications}
                                onChange={(v) => setValue("emailNotifications", v)}
                            />
                            <Toggle
                                label={t("system.slack")}
                                description={t("system.slackDesc")}
                                checked={values.slackIntegration}
                                onChange={(v) => setValue("slackIntegration", v)}
                            />
                            <Toggle
                                label={t("system.push")}
                                description={t("system.pushDesc")}
                                checked={values.realtimePush}
                                onChange={(v) => setValue("realtimePush", v)}
                            />
                        </div>
                    </Card>

                    <Card title={t("system.appearance")} icon={<FiDroplet size={20} />}>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { key: "light", labelKey: "system.light", bg: "bg-white", inner: "bg-gray-100", bar: "bg-gray-300", box: "bg-white border-gray-200", text: "text-[#2f6555]" },
                                { key: "dark", labelKey: "system.dark", bg: "bg-[#1b1b1d]", inner: "bg-[#2f3130]", bar: "bg-gray-400", box: "bg-[#1b1b1d] border-gray-600", text: "text-gray-300" },
                            ].map((tm) => {
                                const active = values.theme === tm.key
                                return (
                                    <button
                                        key={tm.key}
                                        onClick={() => setValue("theme", tm.key)}
                                        className={`relative aspect-video rounded-xl overflow-hidden p-2 transition ${tm.bg} ${active ? "border-2 border-[#2f6555]" : "border border-gray-300 hover:border-[#2f6555]"}`}
                                    >
                                        <div className={`w-full h-full rounded-lg p-2 ${tm.inner}`}>
                                            <div className={`h-2 w-12 rounded mb-2 ${tm.bar}`} />
                                            <div className={`h-8 w-full rounded border ${tm.box}`} />
                                        </div>
                                        {active && <FiCheckCircle className="absolute top-3 right-3 text-[#2f6555]" size={18} />}
                                        <span className={`absolute bottom-2 right-3 text-xs font-bold ${tm.text}`}>{t(tm.labelKey)}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-6">
                            <label className={labelCls}>{t("system.language")}</label>
                            <select
                                value={values.language}
                                onChange={set("language")}
                                className="w-full mt-2 px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm"
                            >
                                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                            </select>
                        </div>
                    </Card>
                </div>
            )}

            {tab !== "managers" && (
                <footer className="mt-auto pt-5 border-t border-gray-200 flex justify-end gap-3 flex-wrap">
                    <button
                        onClick={() => setForm(saved)}
                        disabled={!isDirty || saving}
                        className="px-6 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        {t("action.discard")}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        className="px-8 py-2.5 rounded-lg bg-[#639987] text-white text-sm font-bold shadow-lg shadow-[#639987]/20 hover:bg-[#557f70] transition disabled:opacity-50"
                    >
                        {saving ? t("action.saving") : t("action.save")}
                    </button>
                </footer>
            )}

            <FormModal
                isOpen={isInviteOpen}
                title="Invite HR Manager"
                fields={inviteFields}
                initialValues={INVITE_INITIAL}
                onSubmit={handleInvite}
                onClose={() => setIsInviteOpen(false)}
                submitLabel="Add Manager"
                savingLabel="Adding..."
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Remove HR manager?"
                message={deleteTarget ? `"${deleteTarget.fullName}" will lose HR access.` : ""}
                confirmLabel="Remove"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </motion.section>
    )
}

export default Settings
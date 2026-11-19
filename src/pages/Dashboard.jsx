import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { IoPersonAddOutline, IoAlertCircleOutline } from "react-icons/io5"
import EmployeeFormModal from "../components/EmployeeFormModal"
import LoadingSpinner from "../components/LoadingSpinner"
import StatusBadge from "../components/StatusBadge"
import { employeeCRUD, departmentCRUD, attendanceCRUD, leaveRequestCRUD, payrollCRUD } from "../api/api"

/* ---------- config: change these to match your app ---------- */
const CURRENCY = "EGP"
const ROUTES = { leave: "/leave", payroll: "/payroll", attendance: "/attendance", employees: "/employees" }

const COLORS = {
    present: "#639987",
    late: "#D9A441",
    absent: "#C8553D",
    muted: "#A8C3B9",
}

/* ---------- data ---------- */
function useDashboardData() {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    const load = useCallback(async () => {
        try {
            const today = new Date().toLocaleDateString("en-CA") // YYYY-MM-DD in local time

            const [employees, departments, pending, todayAtt, latestAttRow, latestPayRow, failedPayments] = await Promise.all([
                employeeCRUD.getAll({
                    orderBy: "joinDate",
                    ascending: false,
                    selectQuery: "id, fullName, role, status, PhotoUrl, city, joinDate, DeptId",
                }),
                departmentCRUD.getAll({ selectQuery: "id, DeptName" }),
                leaveRequestCRUD.getAll({
                    filters: { status: "Pending" },
                    orderBy: "createdAt",
                    selectQuery: "id, leaveType, startDate, endDate, urgent, createdAt, employee:Employees(fullName, PhotoUrl, role)",
                }),
                attendanceCRUD.getAll({ filters: { date: today }, selectQuery: "status" }),
                attendanceCRUD.getPage({ pageSize: 1, orderBy: "date", ascending: false, selectQuery: "date" }),
                payrollCRUD.getPage({ pageSize: 1, orderBy: "payPeriodEnd", ascending: false, selectQuery: "payPeriodEnd" }),
                payrollCRUD.count({ status: "Failed" }),
            ])

            // Today's records if there are any, otherwise the latest day on file
            const attDate = todayAtt.length ? today : latestAttRow.data?.[0]?.date ?? null
            const payEnd = latestPayRow.data?.[0]?.payPeriodEnd ?? null

            const [attendance, payroll] = await Promise.all([
                todayAtt.length
                    ? todayAtt
                    : attDate
                        ? attendanceCRUD.getAll({ filters: { date: attDate }, selectQuery: "status" })
                        : [],
                payEnd
                    ? payrollCRUD.getAll({ filters: { payPeriodEnd: payEnd }, selectQuery: "status, netSalary" })
                    : [],
            ])

            setData({
                today,
                employees,
                departments,
                leaves: [...pending].sort((a, b) => Number(b.urgent) - Number(a.urgent)), // urgent first, then oldest
                attDate,
                attendance,
                payEnd,
                payroll,
                failedPayments,
            })
            setError(null)
        } catch (e) {
            setError(e.message || "Could not load dashboard data")
        }
    }, [])

    useEffect(() => { load() }, [load])
    return { data, error, reload: load }
}

/* ---------- helpers ---------- */
const money = (n) => `${CURRENCY} ${Math.round(n).toLocaleString()}`
const shortDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })
const dayCount = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1
const initials = (name = "") => name.split(" ").map((w) => w[0]).slice(0, 2).join("")

const Avatar = ({ src, name, size = "w-10 h-10" }) =>
    src ? (
        <img src={src} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
        <span className={`${size} rounded-full bg-[#A8C3B9] text-[#F9F9F8] flex items-center justify-center text-sm font-semibold`}>
            {initials(name)}
        </span>
    )

const Panel = ({ title, action, children, className = "" }) => (
    <section className={`bg-white border border-[#E4E8E5] rounded-xl p-6 ${className}`}>
        <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            {action}
        </div>
        {children}
    </section>
)

const SeeAll = ({ to }) => (
    <Link to={to} className="text-sm text-[#639987] hover:underline">View all</Link>
)

/* ---------- page ---------- */
const Dashboard = () => {
    const { data, error, reload } = useDashboardData()
    const [isFormOpen, setIsFormOpen] = useState(false)

    const stats = useMemo(() => {
        if (!data) return null

        const count = (rows, status) => rows.filter((r) => r.status === status).length
        const present = count(data.attendance, "Present")
        const late = count(data.attendance, "Late")
        const absent = count(data.attendance, "Absent")
        const attTotal = present + late + absent

        const sum = (status) => data.payroll.filter((r) => r.status === status).reduce((s, r) => s + Number(r.netSalary || 0), 0)
        const payTotal = data.payroll.reduce((s, r) => s + Number(r.netSalary || 0), 0)
        const pay = {
            Paid: sum("Paid"),
            Processing: sum("Processing"),
            Pending: sum("Pending"),
            Failed: sum("Failed"),
            total: payTotal,
        }
        const outstanding = pay.Processing + pay.Pending + pay.Failed

        const working = data.employees.filter((e) => e.status !== "Terminated")
        const onLeave = count(data.employees, "On Leave")

        const deptNames = Object.fromEntries(data.departments.map((d) => [d.id, d.DeptName]))
        const byDept = Object.entries(
            working.reduce((acc, e) => {
                const k = deptNames[e.DeptId] || "Unassigned"
                acc[k] = (acc[k] || 0) + 1
                return acc
            }, {})
        ).sort((a, b) => b[1] - a[1])

        return {
            present, late, absent, attTotal, pay, outstanding,
            workingCount: working.length, onLeave, byDept,
            urgent: data.leaves.filter((l) => l.urgent).length,
            recent: working.slice(0, 5),
        }
    }, [data])

    if (error) {
        return (
            <p className="flex items-center gap-2 text-red-600">
                <IoAlertCircleOutline size={20} /> {error}
            </p>
        )
    }
    if (!data || !stats) return <LoadingSpinner />

    const isToday = data.attDate === data.today
    const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

    const attention = [
        { label: "Leave requests waiting", value: data.leaves.length, note: stats.urgent ? `${stats.urgent} urgent` : null, to: ROUTES.leave, hot: stats.urgent > 0 },
        { label: "Failed payments", value: data.failedPayments, note: "Need a retry", to: ROUTES.payroll, hot: data.failedPayments > 0 },
        { label: "Payments in progress", value: data.payroll.filter((r) => r.status === "Processing" || r.status === "Pending").length, note: money(stats.pay.Processing + stats.pay.Pending), to: ROUTES.payroll, hot: false },
    ]

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">{dateLabel}</p>
                    <h1 className="text-3xl font-bold">Today in your company</h1>
                    <p className="text-gray-500 mt-1">
                        {stats.workingCount} people on the team, {stats.onLeave} currently on leave.
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="h-10 px-5 rounded-lg bg-[#639987] text-[#F9F9F8] flex items-center gap-2 cursor-pointer hover:bg-[#527f70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#639987]"
                >
                    <IoPersonAddOutline size={20} /> Add employee
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance: the main block */}
                <Panel title="Attendance" action={<SeeAll to={ROUTES.attendance} />} className="lg:col-span-2">
                    {stats.attTotal === 0 ? (
                        <p className="text-gray-500">No attendance records yet.</p>
                    ) : (
                        <>
                            <p className="text-5xl font-bold leading-none">
                                {stats.present + stats.late}
                                <span className="text-2xl font-normal text-gray-400"> of {stats.attTotal} checked in</span>
                            </p>
                            {!isToday && (
                                <p className="text-sm text-amber-700 mt-2">
                                    No records for today yet. Showing {shortDate(data.attDate)}, the latest day on file.
                                </p>
                            )}

                            <div className="flex h-4 mt-6 rounded-full overflow-hidden bg-gray-100" role="img"
                                aria-label={`${stats.present} present, ${stats.late} late, ${stats.absent} absent`}>
                                <div style={{ width: `${(stats.present / stats.attTotal) * 100}%`, background: COLORS.present }} />
                                <div style={{ width: `${(stats.late / stats.attTotal) * 100}%`, background: COLORS.late }} />
                                <div style={{ width: `${(stats.absent / stats.attTotal) * 100}%`, background: COLORS.absent }} />
                            </div>

                            <dl className="grid grid-cols-3 gap-4 mt-5">
                                {[["Present", stats.present, COLORS.present], ["Late", stats.late, COLORS.late], ["Absent", stats.absent, COLORS.absent]].map(([label, n, color]) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                                        <div>
                                            <dt className="text-sm text-gray-500">{label}</dt>
                                            <dd className="text-xl font-semibold">{n}</dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </>
                    )}
                </Panel>

                {/* Needs attention */}
                <Panel title="Needs your attention">
                    <ul className="divide-y divide-[#E4E8E5]">
                        {attention.map((a) => (
                            <li key={a.label}>
                                <Link to={a.to} className="flex items-center justify-between py-3 hover:text-[#639987]">
                                    <span>
                                        <span className="block">{a.label}</span>
                                        {a.note && <span className={`text-sm ${a.hot ? "text-[#C8553D]" : "text-gray-500"}`}>{a.note}</span>}
                                    </span>
                                    <span className={`text-3xl font-bold ${a.hot ? "text-[#C8553D]" : ""}`}>{a.value}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Panel>

                {/* Pending leave requests */}
                <Panel title="Leave requests to review" action={<SeeAll to={ROUTES.leave} />} className="lg:col-span-2">
                    {data.leaves.length === 0 ? (
                        <p className="text-gray-500">All caught up. No requests are waiting.</p>
                    ) : (
                        <ul className="divide-y divide-[#E4E8E5]">
                            {data.leaves.slice(0, 5).map((l) => (
                                <li key={l.id} className="flex items-center gap-4 py-3">
                                    <Avatar src={l.employee?.PhotoUrl} name={l.employee?.fullName} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{l.employee?.fullName ?? "Unknown employee"}</p>
                                        <p className="text-sm text-gray-500">
                                            {l.leaveType} · {shortDate(l.startDate)} to {shortDate(l.endDate)} ({dayCount(l.startDate, l.endDate)} days)
                                        </p>
                                    </div>
                                    {l.urgent && <span className="text-xs font-semibold text-[#C8553D] border border-[#C8553D] rounded-full px-2 py-0.5">Urgent</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                    {data.leaves.length > 5 && (
                        <p className="text-sm text-gray-500 mt-3">+ {data.leaves.length - 5} more waiting</p>
                    )}
                </Panel>

                {/* Payroll */}
                <Panel title="Payroll" action={<SeeAll to={ROUTES.payroll} />}>
                    {!data.payEnd ? (
                        <p className="text-gray-500">No payroll runs yet.</p>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500">Period ending {shortDate(data.payEnd)}</p>
                            <p className="text-3xl font-bold mt-1">{money(stats.pay.Paid)}</p>
                            <p className="text-sm text-gray-500">paid out of {money(stats.pay.total)}</p>
                            <ul className="mt-5 flex flex-col gap-3">
                                {["Paid", "Processing", "Pending", "Failed"].map((s) => (
                                    <li key={s}>
                                        <div className="flex justify-between text-sm">
                                            <span>{s}</span>
                                            <span className="text-gray-500">{money(stats.pay[s])}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                                            <div className="h-full rounded-full" style={{
                                                width: `${stats.pay.total ? (stats.pay[s] / stats.pay.total) * 100 : 0}%`,
                                                background: s === "Failed" ? COLORS.absent : s === "Paid" ? COLORS.present : COLORS.muted,
                                            }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </Panel>

                {/* Headcount by department */}
                <Panel title="Team by department">
                    <ul className="flex flex-col gap-3">
                        {stats.byDept.map(([name, n]) => (
                            <li key={name}>
                                <div className="flex justify-between text-sm">
                                    <span>{name}</span>
                                    <span className="text-gray-500">{n}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                                    <div className="h-full rounded-full bg-[#639987]" style={{ width: `${(n / stats.byDept[0][1]) * 100}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>

                {/* Recently joined */}
                <Panel title="Recently joined" action={<SeeAll to={ROUTES.employees} />} className="lg:col-span-2">
                    <ul className="divide-y divide-[#E4E8E5]">
                        {stats.recent.map((e) => (
                            <li key={e.id} className="flex items-center gap-4 py-3">
                                <Avatar src={e.PhotoUrl} name={e.fullName} />
                                <div className="flex-1 min-w-0">
                                    <Link to={`/employees/empDetails/${e.id}`} className="font-medium hover:text-[#639987] truncate block">
                                        {e.fullName}
                                    </Link>
                                    <p className="text-sm text-gray-500 truncate">{e.role} · {e.city}</p>
                                </div>
                                <span className="text-sm text-gray-500 hidden sm:block">Joined {shortDate(e.joinDate)}</span>
                                <StatusBadge status={e.status} />
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>

            <EmployeeFormModal
                isOpen={isFormOpen}
                mode="create"
                employee={null}
                onClose={() => setIsFormOpen(false)}
                onSuccess={async () => {
                    setIsFormOpen(false)
                    await reload()
                }}
            />
        </div>
    )
}

export default Dashboard
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { IoPersonAddOutline, IoAlertCircleOutline } from "react-icons/io5"
import { usePreferences } from "../context/PreferencesContext"
import { useAuth } from "../context/AuthContext"
import { useAsync } from "../Hooks/useAsync"
import { attendanceCRUD, leaveRequestCRUD, payrollCRUD } from "../api/api"
import { useGetEmployeesQuery } from "../store/employeesApi"
import { useGetDepartmentsQuery } from "../store/departmentsApi"
import EmployeeFormModal from "../components/EmployeeFormModal"
import LoadingSpinner from "../components/LoadingSpinner"
import StatusBadge from "../components/StatusBadge"

const CURRENCY = "EGP" 
const ROUTES = {
    leave: "/leave-request",
    payroll: "/payroll",
    attendance: "/attendance",
    employees: "/employees",
}
const COLORS = { present: "#639987", late: "#D9A441", absent: "#C8553D", muted: "#A8C3B9" }


const initials = (name = "") => name.split(" ").map((w) => w[0]).slice(0, 2).join("")
const dayCount = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1

const Avatar = ({ src, name }) =>
    src ? (
        <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />
    ) : (
        <span className="w-10 h-10 rounded-full bg-[#A8C3B9] text-[#F9F9F8] flex items-center justify-center text-sm font-semibold">
            {initials(name)}
        </span>
    )

const Panel = ({ title, to, linkLabel, children, className = "" }) => (
    <section className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-lg font-semibold">{title}</h2>
            {to && <Link to={to} className="text-sm text-[#639987] hover:underline">{linkLabel}</Link>}
        </div>
        {children}
    </section>
)

const Bar = ({ pct, color }) => (
    <div className="h-1.5 rounded-full bg-gray-100 mt-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
)


const Dashboard = () => {
    const { t, language } = usePreferences()
    const { hrProfile } = useAuth()
    const [isFormOpen, setIsFormOpen] = useState(false)

    const shortDate = (d) => new Date(d).toLocaleDateString(language, { month: "short", day: "numeric" })
    const money = (n) => `${CURRENCY} ${Math.round(n).toLocaleString(language)}`

    const { data: employees = [], isLoading: empLoading, error: empError } = useGetEmployeesQuery({
        orderBy: "joinDate",
        ascending: false,
        selectQuery: "id, fullName, role, status, PhotoUrl, city, joinDate, DeptId",
    })
    const { data: departments = [] } = useGetDepartmentsQuery({ selectQuery: "id, DeptName" })


    const { data: live, loading: liveLoading, error: liveError } = useAsync(async () => {
        const today = new Date().toLocaleDateString("en-CA")

        const [pending, todayAtt, latestAtt, latestPay, failedPayments] = await Promise.all([
            leaveRequestCRUD.getAll({
                filters: { status: "Pending" },
                orderBy: "createdAt",
                ascending: true,
                selectQuery: "id, leaveType, startDate, endDate, urgent, createdAt, Employees:employeeId(fullName, role, PhotoUrl)",
            }),
            attendanceCRUD.getAll({ filters: { date: today }, selectQuery: "status" }),
            attendanceCRUD.getPage({ pageSize: 1, orderBy: "date", ascending: false, selectQuery: "date" }),
            payrollCRUD.getPage({ pageSize: 1, orderBy: "payPeriodEnd", ascending: false, selectQuery: "payPeriodEnd" }),
            payrollCRUD.count({ status: "Failed" }),
        ])

       
        const attDate = todayAtt.length ? today : latestAtt.data?.[0]?.date ?? null
        const payEnd = latestPay.data?.[0]?.payPeriodEnd ?? null

        const [attendance, payroll] = await Promise.all([
            todayAtt.length ? todayAtt
                : attDate ? attendanceCRUD.getAll({ filters: { date: attDate }, selectQuery: "status" }) : [],
            payEnd ? payrollCRUD.getAll({ filters: { payPeriodEnd: payEnd }, selectQuery: "status, netSalary" }) : [],
        ])

        return {
            today, attDate, payEnd, attendance, payroll, failedPayments,
            leaves: [...pending].sort((a, b) => Number(b.urgent) - Number(a.urgent)), // urgent first, then oldest
        }
    }, [])

    const stats = useMemo(() => {
        if (!live) return null
        const countBy = (rows, s) => rows.filter((r) => r.status === s).length
        const present = countBy(live.attendance, "Present")
        const late = countBy(live.attendance, "Late")
        const absent = countBy(live.attendance, "Absent")

        const net = (s) => live.payroll.filter((r) => r.status === s).reduce((sum, r) => sum + Number(r.netSalary || 0), 0)
        const pay = { Paid: net("Paid"), Processing: net("Processing"), Pending: net("Pending"), Failed: net("Failed") }
        pay.total = pay.Paid + pay.Processing + pay.Pending + pay.Failed

        const working = employees.filter((e) => e.status !== "Terminated")
        const deptName = Object.fromEntries(departments.map((d) => [d.id, d.DeptName]))
        const byDept = Object.entries(
            working.reduce((acc, e) => ({ ...acc, [e.DeptId]: (acc[e.DeptId] || 0) + 1 }), {})
        )
            .map(([id, n]) => ({ id, name: deptName[id] || t("dash.unassigned", "Unassigned"), n }))
            .sort((a, b) => b.n - a.n)

        return {
            present, late, absent, attTotal: present + late + absent, pay,
            workingCount: working.length,
            onLeave: countBy(employees, "On Leave"),
            urgent: live.leaves.filter((l) => l.urgent).length,
            inProgress: live.payroll.filter((r) => r.status === "Processing" || r.status === "Pending").length,
            byDept,
            recent: working.slice(0, 5),
        }
    }, [live, employees, departments, t])

    const error = empError || liveError
    if (error) {
        return (
            <p className="flex items-center gap-2 text-red-600">
                <IoAlertCircleOutline size={20} /> {String(error)}
            </p>
        )
    }
    if (empLoading || liveLoading || !live || !stats) return <LoadingSpinner />

    const isToday = live.attDate === live.today
    const firstName = (hrProfile?.fullName || "").split(" ")[0]

    const attention = [
        { label: t("dash.leaveWaiting", "Leave requests waiting"), value: live.leaves.length, note: stats.urgent ? `${stats.urgent} ${t("dash.urgent", "Urgent")}` : null, to: ROUTES.leave, hot: stats.urgent > 0 },
        { label: t("dash.failedPay", "Failed payments"), value: live.failedPayments, to: ROUTES.payroll, hot: live.failedPayments > 0 },
        { label: t("dash.payInProgress", "Payments in progress"), value: stats.inProgress, note: money(stats.pay.Processing + stats.pay.Pending), to: ROUTES.payroll, hot: false },
    ]

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        {t("dash.welcomeBack", "Welcome back")}{firstName ? `, ${firstName}` : ""}
                    </h1>
                    <p className="text-gray-500 mt-1 flex flex-wrap gap-x-5">
                        <span>{stats.workingCount} {t("dash.onTeam", "people on the team")}</span>
                        <span>{stats.onLeave} {t("status.On Leave")}</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="h-10 px-5 rounded-lg bg-[#639987] text-[#F9F9F8] flex items-center gap-2 cursor-pointer hover:bg-[#A8C3B9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#639987]"
                >
                    <IoPersonAddOutline size={20} /> {t("emp.add")}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance */}
                <Panel title={t("nav.attendance")} to={ROUTES.attendance} linkLabel={t("dash.viewAll", "View all")} className="lg:col-span-2">
                    {stats.attTotal === 0 ? (
                        <p className="text-gray-500">{t("common.noRecords")}</p>
                    ) : (
                        <>
                            <p className="text-5xl font-bold leading-none">
                                {stats.present + stats.late}
                                <span className="text-2xl font-normal text-gray-400"> / {stats.attTotal} {t("dash.checkedIn", "checked in")}</span>
                            </p>
                            {!isToday && (
                                <p className="text-sm text-amber-700 mt-2">
                                    {t("dash.noToday", "No records for today yet. Showing the latest day on file:")} {shortDate(live.attDate)}
                                </p>
                            )}
                            <div className="flex h-4 mt-6 rounded-full overflow-hidden bg-gray-100" role="img"
                                aria-label={`${stats.present} ${t("status.Present")}, ${stats.late} ${t("status.Late")}, ${stats.absent} ${t("status.Absent")}`}>
                                <div style={{ width: `${(stats.present / stats.attTotal) * 100}%`, background: COLORS.present }} />
                                <div style={{ width: `${(stats.late / stats.attTotal) * 100}%`, background: COLORS.late }} />
                                <div style={{ width: `${(stats.absent / stats.attTotal) * 100}%`, background: COLORS.absent }} />
                            </div>
                            <dl className="grid grid-cols-3 gap-4 mt-5">
                                {[["Present", stats.present, COLORS.present], ["Late", stats.late, COLORS.late], ["Absent", stats.absent, COLORS.absent]].map(([s, n, color]) => (
                                    <div key={s} className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                                        <div>
                                            <dt className="text-sm text-gray-500">{t(`status.${s}`)}</dt>
                                            <dd className="text-xl font-semibold">{n}</dd>
                                        </div>
                                    </div>
                                ))}
                            </dl>
                        </>
                    )}
                </Panel>

                {/* Needs attention */}
                <Panel title={t("dash.attention", "Needs your attention")}>
                    <ul>
                        {attention.map((a) => (
                            <li key={a.label} className="border-t border-gray-200 first:border-t-0">
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
                <Panel title={t("dash.leaveReview", "Leave requests to review")} to={ROUTES.leave} linkLabel={t("dash.viewAll", "View all")} className="lg:col-span-2">
                    {live.leaves.length === 0 ? (
                        <p className="text-gray-500">{t("dash.allCaughtUp", "All caught up. Nothing is waiting.")}</p>
                    ) : (
                        <ul>
                            {live.leaves.slice(0, 5).map((l) => (
                                <li key={l.id} className="flex items-center gap-4 py-3 border-t border-gray-200 first:border-t-0">
                                    <Avatar src={l.Employees?.PhotoUrl} name={l.Employees?.fullName} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{l.Employees?.fullName ?? "—"}</p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {l.leaveType} · {shortDate(l.startDate)} – {shortDate(l.endDate)} ({dayCount(l.startDate, l.endDate)}d)
                                        </p>
                                    </div>
                                    {l.urgent && (
                                        <span className="text-xs font-semibold text-[#C8553D] border border-[#C8553D] rounded-full px-2 py-0.5">
                                            {t("dash.urgent", "Urgent")}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {live.leaves.length > 5 && <p className="text-sm text-gray-500 mt-3">+{live.leaves.length - 5}</p>}
                </Panel>

                {/* Payroll */}
                <Panel title={t("nav.payroll")} to={ROUTES.payroll} linkLabel={t("dash.viewAll", "View all")}>
                    {!live.payEnd ? (
                        <p className="text-gray-500">{t("common.noRecords")}</p>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500">{t("dash.periodEnding", "Period ending")} {shortDate(live.payEnd)}</p>
                            <p className="text-3xl font-bold mt-1">{money(stats.pay.Paid)}</p>
                            <p className="text-sm text-gray-500">{t("status.Paid")} / {money(stats.pay.total)}</p>
                            <ul className="mt-5 flex flex-col gap-3">
                                {["Paid", "Processing", "Pending", "Failed"].map((s) => (
                                    <li key={s}>
                                        <div className="flex justify-between text-sm">
                                            <span>{t(`status.${s}`)}</span>
                                            <span className="text-gray-500">{money(stats.pay[s])}</span>
                                        </div>
                                        <Bar
                                            pct={stats.pay.total ? (stats.pay[s] / stats.pay.total) * 100 : 0}
                                            color={s === "Failed" ? COLORS.absent : s === "Paid" ? COLORS.present : COLORS.muted}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </Panel>

                {/* Team by department */}
                <Panel title={t("dash.byDept", "Team by department")} to="/departments" linkLabel={t("dash.viewAll", "View all")}>
                    <ul className="flex flex-col gap-3">
                        {stats.byDept.map((d) => (
                            <li key={d.id}>
                                <Link to={`/departments/deptDetails/${d.id}`} className="flex justify-between text-sm hover:text-[#639987]">
                                    <span>{d.name}</span>
                                    <span className="text-gray-500">{d.n}</span>
                                </Link>
                                <Bar pct={(d.n / stats.byDept[0].n) * 100} color={COLORS.present} />
                            </li>
                        ))}
                    </ul>
                </Panel>

                {/* Recently joined */}
                <Panel title={t("dash.recent", "Recently joined")} to={ROUTES.employees} linkLabel={t("dash.viewAll", "View all")} className="lg:col-span-2">
                    {stats.recent.length === 0 ? (
                        <p className="text-gray-500">{t("dash.none")}</p>
                    ) : (
                        <ul>
                            {stats.recent.map((e) => (
                                <li key={e.id} className="flex items-center gap-4 py-3 border-t border-gray-200 first:border-t-0">
                                    <Avatar src={e.PhotoUrl} name={e.fullName} />
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/employees/empDetails/${e.id}`} className="font-medium hover:text-[#639987] truncate block">
                                            {e.fullName}
                                        </Link>
                                        <p className="text-sm text-gray-500 truncate">{e.role} · {e.city}</p>
                                    </div>
                                    <span className="text-sm text-gray-500 hidden sm:block" title={t("common.joinDate")}>{shortDate(e.joinDate)}</span>
                                    <StatusBadge status={e.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            {/* The modal uses your create/update mutations, so the store refreshes the lists on its own */}
            <EmployeeFormModal
                isOpen={isFormOpen}
                mode="create"
                employee={null}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => setIsFormOpen(false)}
            />
        </div>
    )
}

export default Dashboard
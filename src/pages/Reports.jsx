/* Libraries */
import {useState, useEffect, useMemo} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {Bar} from "react-chartjs-2"
import {Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Tooltip
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

/* Redux */
import {useGetEmployeesQuery} from '../store/employeesApi'
import {useGetDepartmentsQuery} from '../store/departmentsApi'


/* Hooks */
import {createClient} from "../lib/supabaseClient"
import {downloadCSV} from '../lib/downloadCSV'
import {useToast} from "../context/ToastContext"

/* Icons */
import { FiFilter, FiDownload, FiChevronDown, FiFileText,  FiTrendingDown } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { BsCalendarCheck } from "react-icons/bs";
import { MdOutlineReceiptLong } from "react-icons/md";
import { FaRegFilePdf, FaRegFileAlt } from "react-icons/fa";


const supabase = createClient();

const currency = (n) =>  (n??0).toLocaleString("en-US", {style:'currency', currency: "USD", 
        notation: "compact", maximumFractionDigits:1
    })

const monthShort = m => new Date(2000, m, 1).toLocaleDateString("en-US", {
    month:'short'
})

const deptBarColors = ["#639987", "#a8c3b9", "#2f4f42", "#8f8f8f"]

const Reports = () => {
    const {showToast} = useToast()
    const [year, setYear] = useState(new Date().getFullYear())
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [deptFilter, setDeptFilter] = useState("")
    const [showAllDepts, setShowAllDepts] = useState(false)
    const [showArchives, setShowArchives] = useState(false)
    const [insightDismissed, setInsightDismissed] = useState  (false)
    const [insightExpanded, setInsightExpanded] = useState(false);
    const [exporting, setExporting] = useState(false)
    const [attendanceStats, setAttendanceStats] = useState({present: 0, total: 0})
    const [payrollRows, setPayrollRow] = useState([])
    const [extrasLoading, setExtrasLoading] = useState(true)

    const employeesArgs = useMemo(
        () => (deptFilter ? {filter: {deptName: deptFilter}} : {}),
        [deptFilter]
    )

    const {data: employees  = [], isLoading: employeesLoading} = useGetEmployeesQuery(employeesArgs)
    const {data: departments = [], isLoading: departmentsLoading} = useGetDepartmentsQuery({
        orderBy: "NoEmployees", 
        ascending: false
    })

    const deptOptions = useMemo(
        () => [... new Set(departments.map(d => d.DeptName))].sort(),
        [departments]
    )

    useEffect(() => {
        const fetchExtras = async () => {
            setExtrasLoading(true)
            try {
                let attQuery = supabase.
                from("Attendance")
                .select("status, Employees:EmpId!inner(deptName)")

                if(deptFilter) attQuery = attQuery.eq("Employees.deptName", deptFilter)
                const  {data: attData, error: attER} = await attQuery
            if(attER) throw attER
            const present = (attData || []).filter(r => r.status === "Present").length
            setAttendanceStats({present, total: (attData ||[]).length})

            let pQuery = supabase 
            .from("Payroll")
            .select("employeeId, payPeriodEnd, grossSalary, netSalary, Employees:employeeId!inner(deptName)")
            if(deptFilter) pQuery = pQuery.eq("Employees.deptName", deptFilter)
                const {data:payData, error: payErr} = await pQuery
            if(payErr) throw payErr
            setPayrollRow(payData || [])
            } catch (err){
                console.error("Error loading reports data: ", err)
                showToast(err.messag || "Could not load reports data", "error")
            } finally {
                setExtrasLoading(false)
            }
        }
        fetchExtras()
    }, [deptFilter])

    const loading = employeesLoading || departmentsLoading || extrasLoading

    // Total Employees
    const totalEmployees = employees.length
    const activeCount = employees.filter(e => e.status === "Active").length

    const activeThisMonth = useMemo(() => {
        const now = new Date()
        const count = employees.filter (e => {
            const d = e.joinDate ? new Date(e.jooinDate) : null
            return e.status === "Active" && d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
        return count || activeCount
    }, [employees, activeCount])

    //Attendance
    const avgAttendance = attendanceStats.total > 0 
    ?((attendanceStats.present / attendanceStats.total) * 100).toFixed(1) : "0.0"


    //Payroll  (latest Pay Period)
    const latestPeriod = useMemo(() => {
        if(payrollRows.length === 0) return null 
        return payrollRows.reduce((latest, r) => 
            !latest || new Date(r.payPeriodEnd) > new Date(latest.payPeriodEnd) ? r : latest
        , null)
    }, [payrollRows])

    const latestPeriodRows = useMemo(() => {
        if(!latestPeriod) return []
        return payrollRows.filter(r => r.payPeriodEnd === latestPeriod.payPeriodEnd)
    }, [payrollRows, latestPeriod])

    const monthlyPayroll = latestPeriodRows.reduce((sum, r) =>  sum +(r.netSalary || 0), 0)
    const grossTotal = latestPeriodRows.reduce((sum, r) => sum + (r.grossSalay || 0) *100, 0)
    const budgetUtilization = grossTotal > 0 ? Math.round((monthlyPayroll / grossTotal) * 100) : 0

    //Hiring statistics 
    const hiringData = useMemo(() => {
        const counts = new Array(12).fill(0)
        employees.forEach(e => {
            if(!e.joinDate) return;
            const d = new Date(e.joinDate)
            if(d.getFullYear() === year) counts[d.getMonth()] +=1
        })
        return counts
    }, [employees, year])

    const availableYears = useMemo(() => {
        const years = new Set(employees.map(e => e.joinDate && new Date(e.joinDate).getFullYear()).filter(Boolean))
        years.add(new Date().getFullYear())
        return [... years].sort((a, b) => b-a)
    }, [employees])

    // Department distribution 
    const deptDistribution = useMemo(() => {
       const counts = {};
    employees.forEach((e) => {
        const key = e.deptName || "Unknown";
        counts[key] = (counts[key] || 0) + 1;
    });
    const total = employees.length || 1;
    return Object.entries(counts)
        .map(([name, count]) => ({ name, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.pct - a.pct);
    }, [employees])

    const visibleDepts = showAllDepts ? deptDistribution : deptDistribution.slice(0, 4)

    const handleExportReport = async () => {
        setExporting(true)
        try {
            const summay = [
                {metric: "Total Employees", value: totalEmployees},
                {metric: "Active This Month", value: activeThisMonth},
                {metric: "Average Attendance", value: `${avgAttendance}%`},
                {metirc: "Monthly Payroll", value: monthlyPayroll.toFixed(2)}, 
                {metric: "Budget Utilization", value: `${budgetUtilization}%`},
                ...deptDistribution.map(d => ({metric: `Dept ${d.name}`, value: `${d.pct}%`}))
            ]

        downloadCSV(summay,  `reports_insights_${new Date().toISOString().slice(0, 10)}.csv`)
        showToast("Report exported successfully", "success")
        } finally {
            setExporting(false)
        }
    }

    const maxHire = Math.max(...hiringData, 1)
    return (
    <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0}}
            transition={{ duration: 0.3}}
            className="flex flex-col w-full h-full gap-6"
        >
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold ">Reports &amp; Insights</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Real-time analytical overview of your enterprise workforce health.
                    </p>
                </div>
 
                <div className="flex gap-3 relative">
                    <button
                        onClick={() => setIsFilterOpen((v) => !v)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition"
                    >
                        <FiFilter size={14} /> Filter View{deptFilter ? `: ${deptFilter}` : ""}
                    </button>
                    <button
                        onClick={handleExportReport}
                        disabled={exporting}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2f4f42] text-[#F9F9F8] rounded-full text-sm font-medium hover:bg-[#264036] transition disabled:opacity-60"
                    >
                        <FiDownload size={14} /> {exporting ? "Exporting..." : "Export Report"}
                    </button>
 
                    {isFilterOpen && (
                        <div className="absolute right-0 top-12 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Department</label>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                >
                                    <option value="">All Departments</option>
                                    {deptOptions.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="px-4 py-2 text-sm bg-[#639987] text-[#F9F9F8] rounded-lg hover:bg-[#557f70]"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>
 
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-[#e4efe9] flex items-center justify-center">
                            <HiOutlineUserGroup className="text-[#639987]" size={22} />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#e4efe9] text-[#2f4f42] text-xs font-semibold">
                             12%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Employees</p>
                        <p className="text-4xl font-bold mt-1">{loading ? "—" : totalEmployees.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                        <span>Active this month</span>
                        <span className="font-semibold text-gray-800">{loading ? "—" : activeThisMonth}</span>
                    </div>
                </div>
 
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-[#e4efe9] flex items-center justify-center">
                            <BsCalendarCheck className="text-[#639987]" size={20} />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                            − 0%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Attendance</p>
                        <p className="text-4xl font-bold mt-1">{loading ? "—" : `${avgAttendance}%`}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                        <span>Industry average</span>
                        <span className="font-semibold text-gray-800">88.2%</span>
                    </div>
                </div>
 
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                            <MdOutlineReceiptLong className="text-gray-600" size={22} />
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                            <FiTrendingDown size={12} /> 4.2%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Payroll</p>
                        <p className="text-4xl font-bold mt-1">{loading ? "—" : currency(monthlyPayroll)}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                        <span>Budget utilization</span>
                        <span className="font-semibold text-gray-800">{loading ? "—" : `${budgetUtilization}%`}</span>
                    </div>
                </div>
            </div>
 
            {/* Chart + Departments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Hiring Statistics</h2>
                            <p className="text-sm text-gray-500">New hires (Last 12 months)</p>
                        </div>
                        <div className="relative">
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer"
                            >
                                {availableYears.map((y) => (
                                    <option key={y} value={y}>Year {y}</option>
                                ))}
                            </select>
                            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    </div>
 
                    <div style={{ height: 260 }}>
                        <Bar
                            data={{
                                labels: hiringData.map((_, i) => monthShort(i)),
                                datasets: [
                                    {
                                        label: "New Hires",
                                        data: hiringData,
                                        backgroundColor: "#e9e9e7",
                                        hoverBackgroundColor: "#639987",
                                        borderRadius: 6,
                                        maxBarThickness: 48,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} hires` } },
                                },
                                scales: {
                                    x: { grid: { display: false } },
                                    y: { beginAtZero: true, max: maxHire + 1, ticks: { precision: 0 }, grid: { color: "#eee" } },
                                },
                            }}
                        />
                    </div>
                </div>
 
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
                    <h2 className="text-lg font-bold">Departments</h2>
                    <p className="text-sm text-gray-500 mb-4">Employee allocation by unit</p>
 
                    <div className="flex flex-col gap-4 flex-1">
                        {visibleDepts.length === 0 ? (
                            <p className="text-sm text-gray-400">No department data yet</p>
                        ) : (
                            visibleDepts.map((d, i) => (
                                <div key={d.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{d.name}</span>
                                        <span className="font-semibold">{d.pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${d.pct}%`, backgroundColor: deptBarColors[i % deptBarColors.length] }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
 
                    {deptDistribution.length > 4 && (
                        <button
                            onClick={() => setShowAllDepts((v) => !v)}
                            className="mt-4 border border-gray-200 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                        >
                            {showAllDepts ? "Show Less" : "View Detailed Distribution"}
                        </button>
                    )}
                </div>
            </div>
 
            {/* Generated reports + Automated insight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Generated Reports</h2>
                        <button
                            onClick={() => setShowArchives((v) => !v)}
                            className="text-sm text-[#639987] font-medium hover:underline"
                        >
                            {showArchives ? "Hide Archives" : "View Archives"}
                        </button>
                    </div>
 
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                                <FaRegFilePdf className="text-red-500" size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Q3_Payroll_Analysis.pdf</p>
                                <p className="text-xs text-gray-400">Generated 2h ago • 4.2 MB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                <FaRegFileAlt className="text-green-600" size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Staff_Attendance_Report_Sept.csv</p>
                                <p className="text-xs text-gray-400">Generated Yesterday • 1.1 MB</p>
                            </div>
                        </div>
 
                        <AnimatePresence>
                            {showArchives && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 overflow-hidden"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <FiFileText className="text-gray-500" size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Employees_Directory_Q2.csv</p>
                                        <p className="text-xs text-gray-400">Generated 3 weeks ago • 640 KB</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
 
                {!insightDismissed && (
                    <div className="bg-[#2f4f42] text-white rounded-2xl p-5 flex flex-col gap-4">
                        <h2 className="text-lg font-bold">Automated Insight</h2>
                        <p className="text-sm text-white/80">
                            Based on last month's data, your retention rate in the Engineering department has improved
                            by <span className="font-semibold underline">14%</span> compared to the previous quarter.
                            Consider scaling the internal mentorship program that launched in June.
                            {insightExpanded && (
                                <span className="block mt-2 text-white/70">
                                    This trend is strongest among employees hired within the last 12 months,
                                    suggesting onboarding quality is a key driver of early retention.
                                </span>
                            )}
                        </p>
 
                        <div className="mt-auto flex flex-col gap-2">
                            <button
                                onClick={() => setInsightExpanded((v) => !v)}
                                className="bg-white text-[#2f4f42] rounded-lg py-2 text-sm font-medium hover:bg-gray-100"
                            >
                                {insightExpanded ? "Hide Analysis" : "View Analysis"}
                            </button>
                            <button
                                onClick={() => setInsightDismissed(true)}
                                className="border border-white/30 rounded-lg py-2 text-sm font-medium hover:bg-white/10"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.section>
    )
}
export default Reports
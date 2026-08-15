/* Components */
import Pagination from "../components/Pagination";

/* Libraries */
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

/* Hooks & Context */
import { useState, useEffect, useMemo } from "react";
import { createClient } from "../lib/supabaseClient";
import { downloadCSV } from "../lib/downloadCSV";
import { useToast } from "../context/ToastContext";

/* Icons */
import { FiDownload, FiFilter, FiChevronRight, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { PiMoneyWavyBold } from "react-icons/pi";

const supabase = createClient();
const PAGE_SIZE = 10;

const currency = (n) =>
    (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const monthKey = (dateStr) => dateStr?.slice(0, 7); // "YYYY-MM"
const monthLabel = (key) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
};

const statusStyles = {
    Paid: "bg-green-100 text-green-700",
    Processing: "bg-orange-100 text-orange-700",
    Pending: "bg-gray-100 text-gray-600",
    Failed: "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${statusStyles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
    </span>
);

const Payroll = () => {
    const { showToast } = useToast();

    // Full unpaginated dataset — used only to compute stats/charts, which
    // need to see every record, not just the current table page.
    const [allRows, setAllRows] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);

    const [chartMode, setChartMode] = useState("month"); // "month" | "department"
    const [showAllDepts, setShowAllDepts] = useState(false);

    // Table (paginated) state
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [exporting, setExporting] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [deptFilter, setDeptFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [deptFilter, statusFilter]);

    // Distinct filter options, pulled from real data
    useEffect(() => {
        const loadOptions = async () => {
            const [{ data: emp }, { data: pay }] = await Promise.all([
                supabase.from("Employees").select("deptName"),
                supabase.from("Payroll").select("status"),
            ]);
            setDepartments([...new Set((emp || []).map((r) => r.deptName).filter(Boolean))].sort());
            setStatuses([...new Set((pay || []).map((r) => r.status).filter(Boolean))].sort());
        };
        loadOptions();
    }, []);

    // Full dataset for stats/charts
    useEffect(() => {
        const fetchAll = async () => {
            setStatsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("Payroll")
                    .select("*, Employees:employeeId(deptName)")
                    .order("payPeriodEnd", { ascending: false });

                if (error) throw error;
                setAllRows(data || []);
            } catch (err) {
                console.error("Error fetching payroll stats:", err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Paginated, filtered table
    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true);
            setMessage("");
            try {
                const from = (page - 1) * PAGE_SIZE;
                const to = from + PAGE_SIZE - 1;

                let query = supabase
                    .from("Payroll")
                    .select("*, Employees:employeeId!inner(fullName, PhotoUrl, role, deptName)", { count: "exact" })
                    .order("payPeriodEnd", { ascending: false })
                    .range(from, to);

                if (statusFilter) query = query.eq("status", statusFilter);
                if (deptFilter) query = query.eq("Employees.deptName", deptFilter);

                const { data, error, count } = await query;
                if (error) throw error;

                setRows(data || []);
                setTotalCount(count ?? 0);
            } catch (err) {
                console.error("Error fetching payroll records:", err);
                setMessage(err.message || "Something went wrong loading payroll records");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [page, deptFilter, statusFilter]);

    // ---- Derived stats (computed client-side from allRows) ----

    const monthlyTotals = useMemo(() => {
        const map = new Map();
        allRows.forEach((r) => {
            const key = monthKey(r.payPeriodStart);
            if (!key) return;
            map.set(key, (map.get(key) || 0) + (r.netSalary || 0));
        });
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [allRows]);

    const latestMonth = monthlyTotals[monthlyTotals.length - 1];
    const previousMonth = monthlyTotals[monthlyTotals.length - 2];
    const monthOverMonthPct =
        latestMonth && previousMonth && previousMonth[1] > 0
            ? ((latestMonth[1] - previousMonth[1]) / previousMonth[1]) * 100
            : null;

    // "Current cycle" = the most recent pay period present in the data
    const latestPeriod = useMemo(() => {
        if (allRows.length === 0) return null;
        return allRows.reduce((latest, r) =>
            !latest || new Date(r.payPeriodEnd) > new Date(latest.payPeriodEnd) ? r : latest
        , null);
    }, [allRows]);

    const latestPeriodRows = useMemo(() => {
        if (!latestPeriod) return [];
        return allRows.filter(
            (r) => r.payPeriodStart === latestPeriod.payPeriodStart && r.payPeriodEnd === latestPeriod.payPeriodEnd
        );
    }, [allRows, latestPeriod]);

    const daysRemaining = latestPeriod
        ? Math.ceil((new Date(latestPeriod.payPeriodEnd) - new Date()) / 86400000)
        : null;

    const approvedCount = latestPeriodRows.filter((r) => r.status === "Paid").length;
    const pendingCount = latestPeriodRows.filter((r) => r.status !== "Paid").length;

    const deptTotals = useMemo(() => {
        const map = new Map();
        latestPeriodRows.forEach((r) => {
            const dept = r.Employees?.deptName || "Unknown";
            map.set(dept, (map.get(dept) || 0) + (r.netSalary || 0));
        });
        return [...map.entries()].sort(([, a], [, b]) => b - a);
    }, [latestPeriodRows]);

    const maxDeptTotal = deptTotals[0]?.[1] || 1;

    // ---- Chart data ----

    const chartData = useMemo(() => {
        if (chartMode === "month") {
            const last6 = monthlyTotals.slice(-6);
            return {
                labels: last6.map(([key]) => monthLabel(key)),
                values: last6.map(([, total]) => total),
            };
        }
        return {
            labels: deptTotals.map(([dept]) => dept),
            values: deptTotals.map(([, total]) => total),
        };
    }, [chartMode, monthlyTotals, deptTotals]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const handleExport = async () => {
        setExporting(true);
        try {
            let query = supabase
                .from("Payroll")
                .select("*, Employees:employeeId!inner(fullName, deptName)");

            if (statusFilter) query = query.eq("status", statusFilter);
            if (deptFilter) query = query.eq("Employees.deptName", deptFilter);

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast("No payroll records to export", "error");
                return;
            }

            const flat = data.map((r) => ({
                employee: r.Employees?.fullName,
                department: r.Employees?.deptName,
                employeeId: r.employeeId,
                payPeriodStart: r.payPeriodStart,
                payPeriodEnd: r.payPeriodEnd,
                grossSalary: r.grossSalary,
                netSalary: r.netSalary,
                status: r.status,
                paidDate: r.paidDate,
            }));

            downloadCSV(flat, "payroll_records.csv");
            showToast(`Exported ${flat.length} records to CSV`, "success");
        } catch (err) {
            console.error("Error exporting payroll:", err);
            showToast(err.message || "Export failed — please try again", "error");
        } finally {
            setExporting(false);
        }
    };

    const visibleDepts = showAllDepts ? deptTotals : deptTotals.slice(0, 3);

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col max-w-full h-full p-6 gap-5"
        >
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Payroll Overview</h1>
                    <p className="text-gray-500 text-sm">Enterprise-wide compensation summary and payment history.</p>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Monthly Payroll</p>
                        <p className="text-3xl font-bold mt-1">
                            {statsLoading ? "—" : currency(latestMonth?.[1])}
                        </p>
                        {monthOverMonthPct !== null && (
                            <p className={`text-sm mt-1 flex items-center gap-1 ${monthOverMonthPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {monthOverMonthPct >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                                {Math.abs(monthOverMonthPct).toFixed(1)}% from last month
                            </p>
                        )}
                    </div>
                    <PiMoneyWavyBold className="text-[#a8c3b9]" size={40} />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Upcoming Cycle</p>
                    <p className="text-xl font-bold mt-1">
                        {latestPeriod
                            ? new Date(latestPeriod.payPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                            : "—"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {daysRemaining === null ? "" : daysRemaining >= 0 ? `${daysRemaining} days remaining` : "Cycle closed"}
                    </p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                        <div
                            className="h-full bg-[#639987]"
                            style={{ width: `${Math.max(0, Math.min(100, 100 - (daysRemaining ?? 0)))}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Approved Requests</p>
                    <p className="text-xl font-bold mt-1">{approvedCount} / {latestPeriodRows.length}</p>
                    <p className="text-sm text-gray-500 mt-1">{pendingCount} pending review</p>
                </div>
            </div>

            {/* Chart + Top departments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <h2 className="text-lg font-bold">Total Salary Distribution</h2>
                        <div className="flex bg-gray-100 rounded-full p-1">
                            <button
                                onClick={() => setChartMode("department")}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${chartMode === "department" ? "bg-[#639987] text-white" : "text-gray-600"}`}
                            >
                                By Department
                            </button>
                            <button
                                onClick={() => setChartMode("month")}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${chartMode === "month" ? "bg-[#639987] text-white" : "text-gray-600"}`}
                            >
                                By Month
                            </button>
                        </div>
                    </div>

                    <div style={{ height: 260 }}>
                        {chartData.labels.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                No payroll data yet
                            </div>
                        ) : (
                            <Bar
                                data={{
                                    labels: chartData.labels,
                                    datasets: [
                                        {
                                            label: "Net Salary",
                                            data: chartData.values,
                                            backgroundColor: "#a8c3b9",
                                            hoverBackgroundColor: "#2f4f42",
                                            borderRadius: 6,
                                            maxBarThickness: 56,
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            callbacks: { label: (ctx) => currency(ctx.parsed.y) },
                                        },
                                    },
                                    scales: {
                                        x: { grid: { display: false } },
                                        y: {
                                            beginAtZero: true,
                                            ticks: { callback: (v) => currency(v) },
                                            grid: { color: "#e5e7eb" },
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
                    <h2 className="text-lg font-bold mb-4">Top Departments</h2>
                    <div className="flex flex-col gap-4">
                        {visibleDepts.length === 0 ? (
                            <p className="text-sm text-gray-400">No data yet</p>
                        ) : (
                            visibleDepts.map(([dept, total]) => (
                                <div key={dept}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{dept}</span>
                                        <span className="font-semibold">{currency(total)}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#639987]"
                                            style={{ width: `${(total / maxDeptTotal) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {deptTotals.length > 3 && (
                        <button
                            onClick={() => setShowAllDepts((v) => !v)}
                            className="mt-auto pt-4 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            {showAllDepts ? "Show Less" : "Detailed Breakdown"} <FiChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Records table */}
            <div className="bg-[#F9F9F8] border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-5 flex-wrap gap-3">
                    <h2 className="text-lg font-bold">Individual Payroll Records</h2>
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={() => setShowFilters((v) => !v)}
                            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <FiFilter size={14} /> Filter
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                            <FiDownload size={14} /> {exporting ? "Exporting..." : "Export CSV"}
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 flex flex-col gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Department</label>
                                    <select
                                        value={deptFilter}
                                        onChange={(e) => setDeptFilter(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-1"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mt-1"
                                    >
                                        <option value="">All Statuses</option>
                                        {statuses.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {message && (
                    <p className="px-5 pb-3 text-sm text-red-600">{message}</p>
                )}

                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500 text-xs uppercase border-b">
                            <th className="p-4 font-medium">Employee</th>
                            <th className="p-4 font-medium">ID</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Pay Period</th>
                            <th className="p-4 font-medium">Net Salary</th>
                        </tr>
                    </thead>
                    <tbody className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                        {loading && rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">Loading payroll records...</td>
                            </tr>
                        ) : rows.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">No records found</td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id} className="border-b last:border-0">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={row.Employees?.PhotoUrl}
                                                alt={row.Employees?.fullName}
                                                className="w-9 h-9 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-medium">{row.Employees?.fullName}</p>
                                                <p className="text-xs text-gray-400">{row.Employees?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500">#{row.employeeId}</td>
                                    <td className="p-4"><StatusBadge status={row.status} /></td>
                                    <td className="p-4">
                                        {new Date(row.payPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        {" – "}
                                        {new Date(row.payPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </td>
                                    <td className="p-4 font-semibold">{currency(row.netSalary)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                />
            </div>
        </motion.section>
    );
};

export default Payroll;
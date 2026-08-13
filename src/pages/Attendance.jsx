//Components
import Pagination from "../components/Pagination"
import AttendanceFormModal from "../components/AttendanceFormModal"
import ConfirmDialog from "../components/CofirmDialog"


//Libraries
import { motion } from "framer-motion"
import {Bar} from "react-chartjs-2"
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js"

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip)

//Hooks  & Context
import { useState, useEffect } from "react"
import { createClient } from "../lib/supabaseClient"
import { attendanceCRUD } from "../api/api"
import { downloadCSV } from "../lib/downloadCSV"
import { useToast } from "../context/ToastContext"

//Icons
import { FiDownload, FiEdit2, FiTrash2, FiCalendar, FiFilter } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { FiClock, FiUserX } from "react-icons/fi";
import { BsStopwatch } from "react-icons/bs";

const supabase = createClient();
const PAGE_SIZE = 10;

const todayISO = () => new Date().toISOString().slice(0, 10)

const formatTime = (isoString) => {
    if(!isoString) return '--'
    return new Date(isoString).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit"
    })
} 

const formatMinutes = (mins) => {
    if(!mins && mins !== 0) return "0h 0m"
    const h = Math.floor(mins/60)
    const m = Math.round(mins % 60)
    return `${h}h ${m}m`;
}

const workingMinutes = (checkIn, checkOut) => {
    if(!checkIn || !checkOut) return 0;
    return Math.max(0, (new Date(checkOut) - new Date(checkIn)) /60000)
}

const statusStyles = {
    Present: "bg-green-100 text-green-700",
    Late: "bg-red-100 text-red-700",
    Absent: "bg-gray-100 text-gray-500"
}

const AttendaceBadge = ({status, lateMinutes}) => (
    <span
    className={`px-3 py-1 rounded text-xs font-medium inline-block 
        ${statusStyles[status] || "bg-gray-100 text-gray-700"} `} >
         {status === "Late" && lateMinutes ? 
        `Late (${Math.round(lateMinutes)}m)` : status 
        }   
             </span>
);

const Attendance = () => {
    const {showToast} = useToast();

    const [selectDate, setSelectDate] = useState(todayISO())
    const [deptFilter, setDeptFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("");
    const [departments, setDepartments] = useState([])
    
    const [page, setPage] = useState(1)
    const [rows, setRows] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading]  = useState(false)
    const [message, setMessage] = useState("")

    const [summary, setSummary] = useState({present: 0, late: 0, absent: 0, avgMinutes: 0})
    const [alert, setAlert] = useState(null) //{dept, count} || null
    const [alertDismissed, setAlertDismissed] = useState(false)
    const [trend, setTrend ] = useState([]) //[{date, present}]

    const [editingRecord, setEditingRecord] = useState(null)
    const [deletingRecord, setDeletingRecord] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [exporting, setExporting] = useState(false)

    const [refreshKey, setRefreshKey] = useState(0)

    //Reset To Page 1
    useEffect(() => {
        setPage(1) 
    }, [selectDate, deptFilter, statusFilter])

    //distinct department list for filter 
    useEffect(() => {
        const loadDepartments = async () => {
            const {data} = await supabase.from("Employees").select("deptName");
            setDepartments([... new Set((data || []).map(r => r.deptName).filter(Boolean))].sort())
        };
        loadDepartments();
    }, [])


    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true) 
            setMessage("")

            try {
                const from = (page -1) *PAGE_SIZE
                const to = from + PAGE_SIZE -1

                let query = supabase
                .from("Attendance")
                .select("*, Employees:EmpId!inner(fullName, PhotoUrl, role, deptName)", {count: "exact"})
                .eq("date", selectDate)
                .order("fullName", {foreignTable: "Employees", ascending: true})
                .range(from, to);

                if(statusFilter) query= query.eq("status", statusFilter)
                    if(deptFilter) query = query.eq("Employees.deptName", deptFilter)

                        const {data, error, count} = await query
                        if (error) throw error

                        setRows(data || [])
                        setTotalCount(count ?? 0)
            } catch (err) {
                setMessage(err.message || "Something went wrong loadint attendance")
             console.error("Error fetching attendance:", err);
             setRows([])
            } finally {
                setLoading(false)
            }
        } 

        fetchPage()
    }, [page, selectDate, deptFilter, statusFilter, refreshKey])

    //Summary 
 useEffect(() => {
        const fetchSummary = async () => {
            try {
                let query = supabase
                    .from("Attendance")
                    .select("status, checkIn, checkOut, Employees:EmpId!inner(deptName)")
                    .eq("date", selectDate);
 
                if (deptFilter) query = query.eq("Employees.deptName", deptFilter);
 
                const { data, error } = await query;
                if (error) throw error;
 
                const list = data || [];
                const present = list.filter((r) => r.status === "Present").length;
                const late = list.filter((r) => r.status === "Late").length;
                const absent = list.filter((r) => r.status === "Absent").length;
 
                const withHours = list.filter((r) => r.checkIn && r.checkOut);
                const avgMinutes = withHours.length
                    ? withHours.reduce((sum, r) => sum + workingMinutes(r.checkIn, r.checkOut), 0) / withHours.length
                    : 0;
 
                setSummary({ present, late, absent, avgMinutes });
 
                // Department with the most late employees today
                const lateByDept = {};
                list.filter((r) => r.status === "Late").forEach((r) => {
                    const dept = r.Employees?.deptName || "Unknown";
                    lateByDept[dept] = (lateByDept[dept] || 0) + 1;
                });
                const topLate = Object.entries(lateByDept).sort((a, b) => b[1] - a[1])[0];
                setAlert(topLate ? { dept: topLate[0], count: topLate[1] } : null);
                setAlertDismissed(false);
            } catch (err) {
                console.error("Error fetching attendance summary:", err);
            }
        };
        fetchSummary();
    }, [selectDate, deptFilter, refreshKey]);

    //Punctuality trend — Present count per day, for the 6 most recent day
    useEffect(() => {
        const fetchTrend = async () => {
            try {
                const {data, error} = await supabase
        .from ('Attendance')
        .select("date, status")
        .lte("date", selectDate)
        .order("date", {ascending: false})

        if(error) throw error
        const byDate = new Map();
        (data || []).forEach(r => {
            if(!byDate.has(r.date)) byDate.set(r.date, {present:0 , total: 0})
            // THIS was the bug — the bucket was created but never updated,
            // so every day stayed at {present: 0, total: 0} forever.
            const bucket = byDate.get(r.date);
            bucket.total += 1;
            if (r.status === "Present") bucket.present += 1;
            })

            const lastSix = [...byDate.entries()].slice(0, 6).reverse();

            setTrend(
                lastSix.map(([date, {present}]) => ({
                    date, present, label: new Date(date).toLocaleDateString("en-US", {weekday: "short"}),
                    isSelected : date === selectDate,  
                }))
            )
            } catch (err) {
                console.error("Error fetching punctuality trend", err)
            }
        };
        fetchTrend()
    }, [selectDate, refreshKey])

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));


    //Exporting data to CSV files
    const handleExport = async () => {
        setExporting(true)
        try {
            let query = supabase
            .from("Attendance")
            .select("*, Employees:EmpId!inner(fullName, deptName)")
            .eq("date", selectDate);

            if(statusFilter) query = query.eq("status", statusFilter)
                if(deptFilter) query = query.eq("Employees.deptName", deptFilter)

            const {data, error} = await query;
            if(error) throw error

            if(!data || data.length ===0) {
                showToast("No attendance records to export", "error")
                return;
            }


            const flat = data.map(r => ({
                employee: r.Employees?.fullName, 
                department: r.Employees?.deptName, 
                date: r.date, 
                checkIn: r.checkIn,
                checkOut: r.checkOut, 
                status: r.status,
                latetMinutes: r.lateMinutes
            }));
            downloadCSV(flat, `attendance_${selectDate}.csv`)
            showToast(`Exported ${flat.length} records to CSV`, "success")
        }catch(err){
            console.error("Error exporting attendance", err)
            showToast(err.message || "Export Failed -- please try again", "error")
        } finally {
            setExporting(false)
        }
    }

    //Deletion Confirm
    const handleDeleteConfirmed = async () => {
        setDeleting(true);
        try {
            await attendanceCRUD.remove(deletingRecord.id)
            setRefreshKey(k => k+1)
            showToast("Attendance record deleted", "success")
        } catch (err) {
            console.error("Error deleting attendance record: ", err)
            showToast(err.message || "Couldm't delete record", "error")
        } finally {
            setDeleting(false)
            setDeletingRecord(null)
        }
    }

    //update record
    const handleRecordUpdate = () => {
        setEditingRecord(null)
        setRefreshKey(k => k+1)
        showToast("Attendance updated successfully", "success")
    }
    return (
        <>
        <motion.section
        initial = {{opacity: 0, y: 10}}
        animate = {{opacity: 1, y: 0}}
        transition={{duration: 0.3}}
        className="flex flex-col max-w-full h-full p-6 gap-5"
        >

            {/* Header */}
            <header className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Attendance Monitoring</h1>
                    <p className = "text-gray-500 text-sm">Real-time over sight of enterprise workforce presence and punctuality</p>
                </div>

                <button
                onClick={handleExport}
                disabled = {exporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#F9F9F8] text-sm font-medium bg-[#2C2C2E] hover:bg-gray-600 transition"
                >
                    <FiDownload size={16}/> {exporting ? "Exporting......" : "Export Report"}
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Total Present
                            </p>
                            <HiOutlineUserGroup className="text-[#639987]" size= {18} />
                    </div>
                    <p className="text-2xl font-bold">
                        {summary.present} <span className="text-sm font-normal text-gray-400">/ {totalCount}</span>
                    </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Total Late
                            </p>
                            <FiClock className="text-[#639987]" size= {18} />
                    </div>
                    <p className="text-2xl font-bold">
                        {summary.late}
                    </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Total Absent
                            </p>
                            <FiUserX className="text-[#639987]" size= {18} />
                    </div>
                    <p className="text-2xl font-bold">
                        {summary.absent}
                    </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                           Avg. Working Hours
                            </p>
                            <BsStopwatch className="text-[#639987]" size= {18} />
                    </div>
                    <p className="text-2xl font-bold">
                        {formatMinutes(summary.avgMinutes)}
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                   <FiCalendar  size={16} className="text-gray-500"/>
                   <input type="date" 
                   value={selectDate} 
                   onChange={e => setSelectDate(e.target.value)}
                   className="outline-none bg-transparent"
                   /> 
                </label>

                <select 
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                        <option key = {d} value={d}>{d}</option>
                    ))}
                </select>

                <label  className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                     <FiFilter size={14} className="text-gray-500" />
                     <select
                     value={statusFilter}
                     onChange={e => setStatusFilter(e.target.value)}
                     className="outline-none bg-transparent"
                     >
                        <option value="">All Statuses</option>
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                     </select>
                </label>

                <p className="ml-auto text-sm text-gray-500">
                    Showing {totalCount.toLocaleString()} records
                </p>
            </div>

            {/* Table */}
      <div className="bg-[#F9F9F8] border border-gray-200 rounded-xl overflow-hidden">
                    {message && (
                        <p className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">{message}</p>
                    )}
 
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 text-xs uppercase border-b">
                                <th className="p-4 font-medium">Employee Name</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Check-In</th>
                                <th className="p-4 font-medium">Check-Out</th>
                                <th className="p-4 font-medium">Working Hours</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Action</th>
                            </tr>
                        </thead>
 
                        <tbody className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                            {loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">Loading attendance...</td>
                                </tr>
                            ) : rows.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">No records found for this day</td>
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
                                        <td className="p-4">
                                            {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                        <td className={`p-4 ${row.status === "Late" ? "text-red-600" : ""}`}>
                                            {formatTime(row.checkIn)}
                                        </td>
                                        <td className="p-4">{formatTime(row.checkOut)}</td>
                                        <td className="p-4">{formatMinutes(workingMinutes(row.checkIn, row.checkOut))}</td>
                                        <td className="p-4">
                                            <AttendaceBadge status={row.status} lateMinutes={row.lateMinutes} />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-3 items-center">
                                                <button onClick={() => setEditingRecord(row)} className="cursor-pointer">
                                                    <FiEdit2 className="text-gray-500 hover:text-[#639987]" size={16} />
                                                </button>
                                                <button onClick={() => setDeletingRecord(row)} className="cursor-pointer">
                                                    <FiTrash2 className="text-gray-500 hover:text-red-600" size={16} />
                                                </button>
                                            </div>
                                        </td>
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

                {/* Trend chart + alert */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                        <h2 className="text-lg font-bold mb-4">Punctuality Trends</h2>
                        <div className="bg-gray-50 rounded-lg p-4 h-[220px] flex items-end justify-between ">
                            {trend.length === 0 ? (
                                <p className="text-sm text-gray-400 m-auto">No data yet for this range</p>
                            ) : (
                               <Bar 
                               data = {{
                                labels: trend.map(t => t.isSelected ? `${t.label} (Selected)` : t.label),
                                datasets: [
                                    {
                                        label: "Present",
                                        data: trend.map(t => t.present),
                                        backgroundColor: trend.map(t => t.isSelected ? '#2f4f42' : '#a8c3b9'),
                                        borderRadius: 6, 
                                        maxBarThickness: 48
                                    },
                                ],
                               }}
                               options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins : {
                                    legend : {display: false},
                                    tooltip: {
                                        callbacks: {
                                            title: (items) => {
                                                const t = trend[items[0].dataIndex];
                                                return t
                                                ? new Date(t.date).toLocaleString("en-US", {weekday: "long", month: "short", day:"numeric"})
                                                : "";
                                            },
                                            label: (ctx) => `${ctx.parsed.y} present`
                                        },
                                    },
                                },
                                scales: {
                                    x: {grid: {display: false}},
                                    y: {
                                        beginAtZero: true, 
                                        ticks: {precision: 0},
                                        grid:{color: '#e5e7eb'},
                                    },
                                },
                               }}
                               />
                            )
                        }
                        </div>
                    </div>

                    {alert && !alertDismissed && (
                        <div className="bg-[#2f4f42] text-white rounded-xl p-5 flex flex-col gap-4">
                            <h2 className="text-lg font-bold">Automated Alert</h2>
                            <p className="text-sm text-white/80">
                            {alert.dept} team has {alert.count} employee{alert.count > 1 ? "s" : ""} currently late.
                            </p>

                            <div className="mt-auto flex flex-col gap-2">
                                <button
                                onClick={() => showToast(`Leads notified about ${alert.dept} lateness`, "info")}
                                className="bg-white text-[#2f4f42] rounded-lg py-2 text-sm font-medium hover:bg-gray-100"
                                >
                                    Notify Leads
                                </button>

                                <button
                                onClick={() => setAlertDismissed(true)}
                                 className="border border-white/30 rounded-lg py-2 text-sm font-medium hover:bg-white/10"
                                >
                                    Dismiss All
                                </button>
                            </div>
                        </div>
                    )}
                </div>
        </motion.section>

        <AttendanceFormModal
        isOpen={!!editingRecord}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={handleRecordUpdate}
        /> 

        <ConfirmDialog
        isOpen={!!deletingRecord}
        title= "Delete this record?"
        message={deletingRecord ? `Attendance for "${deletingRecord.Employees?.fullName}" on ${deletingRecord.date} will be Premanently removed` : ""}
        onCancel={() => setDeletingRecord(null)}
        onConfirm={handleDeleteConfirmed}
        loading={deleting}
        />
        </>
    )
}
export default Attendance
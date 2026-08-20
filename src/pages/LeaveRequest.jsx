import { useMemo, useState } from "react"
import LeaveRequestFormModal from '../components/LeaveRequestFormModal'
import { motion } from "framer-motion"
import { leaveRequestCRUD } from "../api/api"
import {useAuth} from '../context/AuthContext'
import {useToast} from '../context/ToastContext'
import {useAsync} from '../Hooks/useAsync'
import {downloadCSV} from '../lib/downloadCSV'
import realtiveTime from  '../lib/relativeTime'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiDownload, FiPlus, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import SkeletonLoader from "../components/SkeletonLoader"

const QUICK_FILTERS = ["All", "Sick leave", "Vecation", "Remote"]

const statusStyle = {
    pending: "bg-orange-100 text-orange-700",
    Approved: "bg-green-100 text-green-700",
    Declined: "bg-red-100 text-red-7000"
}

const StatusPill = ({status}) => (
    <span className= {`flex  items-center justify-center gap-2 px-3 py-1 rounded-3xl ${status === "Pending"  ? statusStyle.pending: ""} 
    ${status === "Declined" ? statusStyle.Declined: ""} ${statusStyle.Approved}
    `}> 
        {status === "Pending" && <FiClock Size={12}/> } {status}
         </span>
)

const isSameMonth = (isoString) => {
    if(!isoString) return false 
    const d = new Date(isoString)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

const isToday = (isoString) => {
    if(!isoString) return false
    return new Date(isoString).toDateString() === new Date().toDateString()
}

const durationDays = (start, end) => {
    Math.max(1, Math.round((new Date(end) -new Date(start))/86400000) + 1)
}

const LeaveRequest = () => {
    const {hrProfile} = useAuth();
    const {showToast} = useToast()

    const {data: requests, setData, loading, error, refetch} = useAsync(
        () => 
            leaveRequestCRUD.getAll({
                orderBy: "createdAt",
                ascending: true,
                selectQuery: "*, Employees:employeeId(fullName, role, deptName, PhotoUrl)"
            }),
            []
    )

    const [quickFilter, setQuickFilter] = useState("All")
    const [isNewRequestOpen, ssetIsNewRequestOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [actingId, setActingId] = useState(null)

    const all = requests || []

    const pending = useMemo(() => {
        let list = all.filter(r => r.status === "Pending")
        if(quickFilter !=="All") list = list.filter(r => r.leaveType === quickFilter)
            return list
    }, [all, quickFilter])

    const featured = pending[0] || null 
    const rest = pending.slice(1)

    const pendingCount = all.filter(r => r.status ==="Pending").length
    const pendingToday = all.filter(r =>  r.status === "Pending" && isToday(r.createdAt)).length
    const approvedThisMonth = all.filter(r => r.status === "Approved" && isSameMonth(r.createdAt)).length

    const recentActions = useMemo(() => {
        return all 
        .filter(r=> r.reviewedAt)
        .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt))
        .slice(0, 5)
    }, [all])

    const handleDecision = async (request, decision) =>{
        setActingId(request.id)
        try {
           const update =  await leaveRequestCRUD.update(request.id, {
                status: decision,
                reviewedAt: new Date().toISOString(),
                reviewedBy: hrProfile?.fullName || "HR"
            })
            setData(prev => prev.map(r => r.id === request.id ? {...r, ...update}: r))
            showToast(`Request ${decision.toLowerCase()}.`, decision === "Approved" ? "success" : "info")
        } catch(err) {
            console.error("Error updating leave request", err)
            showToast(err.message || "Couldn't update this request", "error")
        } finally {
            setActingId(null)
        }
    }

    const handleExport = async () => {
        setExporting(true)
        try{
            const flat = all.map(r => ({
                employee: r.Employees?.fullName,
                department: r.Employees?.deptName,
                leaveType: r.leaveType, 
                startDate:r.startDate, 
                endDate: r.endDate,
                status: r.status,
                urgent: r.urgent,
                reason: r.reason
            }))

            if(flat.length ===0 ){
                showToast("No leave requests to export", "error")
                return;
            }

            downloadCSV(flat, `leave_requests_${new Date().toIsoString().slice(0, 10)}.csv`)
            showToast(`Exported ${flat.length} requsets to CSV`, "success")
        }catch (err){
            console.error("Exporting Faild", err)
            showToast(err.massge || "Couldn't Export requsets", "error")
               }finally{
            setExporting(false)
        } 
    }
    return(
       <motion.section
       initial ={{opacity: 0, y: 10}}
       animate = {{opacity: 1, y: 0}}
       transition={{duration: 0.3}}
       className="flex flex-col max-w-full h-full p-6 gap-5"
       >
        <div className="flex items-center justify-between flex-wrap gap-4" >
            <div>
                <h1 className="text-2xl font-bold">Leave Requests</h1>
                <p className="text-gray-500 text-sm">Manage and review employee time-off applications</p>
            </div>

            <div className="flex gap-3">
                <button
                onClick={handleExport}
                disabled = {exporting}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50"
                >
                    <FiDownload size= {16}/ > {exporting ? "Exporting...." : "Export CSV"}
                </button>
                <button
                onClick={() => ssetIsNewRequestOpen(true)}
                className="flex items-center gap-2 px-4  py-2 bg-[#639987] text-[#f9f9f8] rounded-lg text-sm font-medium hover:bg[#557f70] transition"
                >
                    <FiPlus size={16}/> New Request
                </button>
            </div>
        </div>

        {loading ? (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
    <div className="lg:col-span-2"><SkeletonLoader variant="cards" count={3} /></div>
    <div className="flex flex-col gap-3"><SkeletonLoader variant="list" rows={5} /></div>
</div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              <div className="lg:col-span-2 flex flex-col gap-5">
                  {/* Featured Pending request */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    {!featured ?(
                        <p className="text-center text-gray-400 py-12">
                           No pending requests {quickFilter !== "All" ? `for ${quickFilter} `: ""}. 
                        </p>
                    ):(
                        <>
                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                 <img 
                                 src= {featured.Employees?.PhotoUrl}
                                  alt={featured.Employees?.fullName} 
                                  className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div>
                                    <h2 className="text-lg font-semibold">{featured.Employees?.fullName}</h2>
                                    <p className="text-sm text-gray-500">
                                        {featured.Employees?.role} - {featured.Employees?.deptName}
                                    </p>
                                  </div>
                            </div>

                            <StatusPill status={featured.status}/>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b py-4 my-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-400 uppercast">Leave type</p>
                                <p className="font-semibold mt-1">{featured.leaveType}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 uppercast">Duration</p>
                                <p className="font-semibold mt-1">{durationDays(featured.startDate, featured.endDate)}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 uppercast">Start Date</p>
                                <p className="font-semibold mt-1">{new Date(featured.startDate).toLocaleDateString('en-US', {month: "short", day: "numeric", year: "numeric"})}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 uppercast">End Date</p>
                                <p className="font-semibold mt-1">{new Date(featured.endDate).toLocaleDateString('en-US', {month: "short", day: "numeric", year: "numeric"})}</p>
                            </div>
                        </div>

                        {featured.reason && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-400 uppercase mb-1">Reason</p>
                                <p className="text-sm italic text-gray-600">"{featured.reason}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                            onClick={() => handleDecision(featured, "Declined")}
                            disabled = {actingId === featured.id}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            >
                                Decline
                            </button>
                            <button
                            onClick={() => handleDecision(featured, "Approved")}
                            disabled= {actingId === featured.id}
                            className="px-5 py-2 text-sm font-medium bg-[#639987] text-[#f9f9f8] rounded-lg hover:bg-[#557f70] disabled:opacity-50"
                            >
                                {actingId === featured.id ? "Saving...." : "Approve"} 
                            </button>
                        </div>
                        <div>
                        </div>
                        </>
                    )}
                  </div>
                   {/* Remaining pending requests */}
                   {rest.length > 0  && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rest.map(r => (
                            <div
                            key = {r.id} 
                            className="bg-white border border-gray-200 rounded-xl p-5 flex-col gap-3"
                            >
                                <div  className="flex items-center justify-between gap-2"> 
                                    <div className="flex items-center gap-3">
                                        <img className="w-12 h-12 rounded-full" src={r.Employees?.PhotoUrl} alt={r.Employees?.fullName} />
                                        <div>
                                            <p className="font-medium">{r.Employees?.fullName}</p>
                                            <p className="text-xs text-gray-500">{r.Employees?.deptName}- {r.leaveType}</p>
                                        </div>
                                    </div>

                                    {r.urgent && (
                                        <span className="px-2 py-1 rounded-full bg-red-100  text-red-600 text-[10px] font-semibold uppercase">Urgent</span>
                                    )}
                                </div>

                                {r.reason && <p className="text-sm text-gray-500 line-clamp-2">"{r.reason}"</p>}

                                <div className="flex justify-end gap-2 mt-auto pt-2 border-t">
      <button
                                    onClick={() => handleDecision(r, "Declined")}
                                    disabled = {actingId === r.id}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                    >
                                        Decline
                                    </button>

                                    <button
                                    onClick={() => handleDecision(r, "Approved")}
                                    disabled = {actingId === r.id}
                                    className="px-3 py-1.5 text-xs font-medium bg-[#639987] text-[#f9f9f8] rounded-lg hover:bg-[#557f70] disabled:opacity-50"
                                    >
                                        Approve
                                    </button>
                              
                                </div>
                            </div>
                        ))}
                    </div>
                   )}
              </div>

              {/* Right side  */}
              <div className="flex flex-col gap-5">
                <div className="bg-white corder border-gray-200 rounded-xl p-5">
                 <h2 className="text-lg font-bold mb-4">Request Overview</h2>

                 <div className="flex flex-col gap-3">
                    <div className="bg-[#f9f9f8] rounded-lg  p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                              <FiClock className="text-orange-600" size={18}/> 
                          </div>

                          <div> 
                            <p className="text-xs text-gray-500">Pending Requests</p>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                          </div>
                        </div>

                        {pendingToday > 0 && <span className="text-xs text-red-500 font-medium">+{pendingToday} today</span> }
                    </div>

                    <div className="bg-[#f9f9f8] rounded-lg p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FiCheckCircle className="text-green-600" size= {18}/>
                        </div>

                        <div>
                            <p className="text-xs text-gray-500">Approved (Month)</p>
                            <p className="text-2xl font-bold">{approvedThisMonth}</p>
                        </div>
                    </div>
                 </div>

                 <div className="mt-5 pt-4 border-t">
                    <p className="text-xs text-gray-400 uppercase mb-2">Quick Filter</p>
                    <div className="flex flex-wrap gap-2 ">
                        {QUICK_FILTERS.map(f => (
                            <button
                            key={f}
                            onClick={() => setQuickFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition 
                                ${quickFilter === f ? "bg-[#639987] text-[#f9f9f8]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                                `}
                            >
                                {f}
                                 </button> 
                        ))}
                    </div>
                 </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-lg font-bold mb-4">Recent Actions</h3>

                    {recentActions.length === 0 ? (
                        <p className="text-sm text-gray-400">No actions yet.</p>
                    ): (
                        <div className="flex flex-col gap-4">
                            {recentActions.map(r => (
                         <div>
                                   <div
                                    key={r.id}
                                    className="flex items-start gap-3"
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 
                                        ${r.status === "Approved" ? statusStyle.Approved : "bg-red-100"}
                                        `}>
                                        {r.status === "Approved" ? (
                                            <FiCheckCircle size={14} className="text-green-600" />
                                        ) : (
                                            <FiXCircle className="text-red-600" size={14} />
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-sm">
                                    You {r.status === "Approved" ? "approved" : "decline"}{" "}
                                    <span className="font-semibold">{r.leaveType}</span>
                                    </p>            
                                    <p className="text-xs text-gray-400">{realtiveTime(r.reviewedAt)}</p>
                                </div>
                         </div>               
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </div>
        ) }

        <LeaveRequestFormModal
        isOpen={isNewRequestOpen}
        onClose={() => ssetIsNewRequestOpen(false)}
        onSuccess={async () => {
            ssetIsNewRequestOpen(false)
            await refetch();
            showToast("Leave request submitted", "success")
        }}
        />
       </motion.section>
    )
}

export default LeaveRequest
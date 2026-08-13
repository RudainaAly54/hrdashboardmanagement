import { attendanceCRUD } from "../api/api";
import FormModal from "./FormModal";
import { computeAttendanceStatus, SHIFT_START_TIME } from "../lib/attendanceConfig";

// Pull just the HH:MM portion out of a timestamptz value for a <input type="time">
const toTimeInput = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const to12Hour = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const statusPreviewStyles = {
    Present: "bg-green-100 text-green-700",
    Late: "bg-red-100 text-red-700",
    Absent: "bg-gray-100 text-gray-500",
};

const AttendanceFormModal = ({ isOpen, record, onClose, onSuccess }) => {
    const initialValues = {
        checkInTime: toTimeInput(record?.checkIn),
        checkOutTime: toTimeInput(record?.checkOut),
    };

    const fields = [
        { name: "checkInTime", label: "Check-In", type: "time" },
        { name: "checkOutTime", label: "Check-Out", type: "time" },
        {
            name: "statusPreview",
            type: "custom",
            span: 2,
            render: (values) => {
                const { status, lateMinutes } = computeAttendanceStatus(values.checkInTime);
                return (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500">
                            Shift starts at {to12Hour(SHIFT_START_TIME)} — status is calculated automatically
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusPreviewStyles[status]}`}>
                            {status === "Late" && lateMinutes ? `Late (${lateMinutes}m)` : status}
                        </span>
                    </div>
                );
            },
        },
    ];

    const handleSubmit = async (values) => {
        const day = record.date; // "YYYY-MM-DD", stays fixed — only the times change
        const { status, lateMinutes } = computeAttendanceStatus(values.checkInTime);

        const payload =
            status === "Absent"
                ? { status: "Absent", checkIn: null, checkOut: null, lateMinutes: null }
                : {
                      status,
                      checkIn: `${day}T${values.checkInTime}:00`,
                      checkOut: values.checkOutTime ? `${day}T${values.checkOutTime}:00` : null,
                      lateMinutes,
                  };

        await attendanceCRUD.update(record.id, payload);
        onSuccess();
    };

    return (
        <FormModal
            isOpen={isOpen}
            title="Edit Attendance"
            fields={fields}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onClose={onClose}
            submitLabel="Save Changes"
            savingLabel="Saving..."
        />
    );
};

export default AttendanceFormModal;
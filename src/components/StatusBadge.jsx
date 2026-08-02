const statusStyles = {
    Active: "bg-green-100 text-green-700",
    "On Leave": "bg-orange-100 text-orange-700",
    Terminated: "bg-red-100 text-red-700",
    Remote: "bg-blue-100 text-blue-700",
};

const StatusBadge = ({ status }) => {
    const colorClasses = statusStyles[status] || "bg-gray-100 text-gray-700";

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${colorClasses}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
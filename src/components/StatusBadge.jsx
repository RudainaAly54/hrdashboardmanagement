const statusStyles = {
    Active: " text-green-700",
    "On Leave": "text-yellow-700",
    Terminated: "text-red-700",
    Remote: "text-blue-700",
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
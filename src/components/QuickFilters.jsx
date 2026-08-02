import { FiX, FiFilter } from "react-icons/fi";

const filterLabels = {
    deptName: "Department",
    status: "Status",
    city: "Location",
};

const QuickFilters = ({ filters, onRemoveFilter, onClearAll, onOpenMore }) => {
    const activeEntries = Object.entries(filters).filter(([, value]) => value);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Quick Filters</p>
                {activeEntries.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-[#639987] font-medium hover:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {activeEntries.map(([key, value]) => (
                    <span
                        key={key}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#639987] text-[#F9F9F8] text-xs font-medium"
                    >
                        {filterLabels[key]}: {value}
                        <button onClick={() => onRemoveFilter(key)} className="hover:opacity-70">
                            <FiX size={12} />
                        </button>
                    </span>
                ))}

                <button
                    onClick={onOpenMore}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition ml-auto"
                >
                    <FiFilter size={14} /> More Filters
                </button>
            </div>
        </div>
    );
};

export default QuickFilters;
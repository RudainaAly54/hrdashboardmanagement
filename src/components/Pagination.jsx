import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ page, totalPages, totalCount, pageSize, onPageChange }) => {
    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between p-4 border-t text-sm text-gray-500">
            <p>
                {totalCount === 0
                    ? "No results"
                    : `Showing ${rangeStart} to ${rangeEnd} of ${totalCount}`}
            </p>
            <div className="flex items-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <FiChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 rounded-lg bg-[#639987] text-[#F9F9F8] font-medium">
                    {page}
                </span>
                <span className="text-gray-400">of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    <FiChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
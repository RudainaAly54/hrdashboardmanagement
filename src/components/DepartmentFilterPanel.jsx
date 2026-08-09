const CATEGORY_OPTIONS = ["Technical", "Business", "Operations", "Revenue", "Creative", "Strategic", "Success"];

const DepartmentFilterPanel = ({ category, onCategoryChange, sortBy, onSortChange, onClose }) => {
    return (
        <div className="absolute z-40 top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64 flex flex-col gap-4">
            <div>
                <label className="text-xs text-gray-500 uppercase">Category</label>
                <select
                    value={category || ""}
                    onChange={(e) => onCategoryChange(e.target.value || null)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="">All</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-500 uppercase">Sort By</label>
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="alphabetical">Alphabetical</option>
                    <option value="mostEmployees">Most Employees</option>
                    <option value="fewestEmployees">Fewest Employees</option>
                </select>
            </div>

            <div className="flex justify-end pt-2 border-t">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm bg-[#639987] text-[#F9F9F8] rounded-lg hover:bg-[#557f70]"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default DepartmentFilterPanel;
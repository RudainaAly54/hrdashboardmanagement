import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseClient";

const supabase = createClient();

const STATUS_OPTIONS = ["Active", "On Leave", "Terminated", "Remote"];

const MoreFiltersPanel = ({ onApply, onClose }) => {
    const [departments, setDepartments] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    // Pull the distinct values that actually exist, so the dropdowns
    // never offer an option with zero matching employees.
    useEffect(() => {
        const loadOptions = async () => {
            const { data: deptRows } = await supabase.from("Employees").select("deptName");
            const { data: cityRows } = await supabase.from("Employees").select("city");

            setDepartments([...new Set(deptRows?.map(r => r.deptName).filter(Boolean))].sort());
            setCities([...new Set(cityRows?.map(r => r.city).filter(Boolean))].sort());
        };
        loadOptions();
    }, []);

    const handleApply = () => {
        onApply({
            deptName: selectedDept || null,
            status: selectedStatus || null,
            city: selectedCity || null,
        });
        onClose();
    };

    return (
        <div className="absolute z-40 top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72 flex flex-col gap-4">
            <div>
                <label className="text-xs text-gray-500 uppercase">Department</label>
                <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="">Any</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="">Any</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs text-gray-500 uppercase">Location</label>
                <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="">Any</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
                    Cancel
                </button>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 text-sm bg-[#639987] text-[#F9F9F8] rounded-lg hover:bg-[#557f70]"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};

export default MoreFiltersPanel;
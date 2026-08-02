import { FiSearch } from "react-icons/fi";
/* Icons */
import { FaRegCalendar } from "react-icons/fa";
import { CiBellOn } from "react-icons/ci";

const Header = ({value, onChange, placeholder =  "Search employees, ID, or department ....", props = {headerTitle: "Employee Management"}}) => {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

    return (

    <header className = "flex  items-center justify-evenly gap-3 px-6 py-4 border-b  md:w-full">
        <h2 className="hidden md:block text-2xl font-[inter] font-bold"> {props.headerTitle}</h2>
       <div className="relative w-full max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C3B9]"
        />
    </div>
        <div className = "flex gap-4 items-center">
        <CiBellOn size={24} className = "text-gray-500 mr-4"/>
        <FaRegCalendar size={24} className = "text-gray-500"/>
        <div className = "flex items-center gap-2">
         <div className="border-l border-gray-300 h-8"></div>
        <h4 className="hidden md:block text-md font-[inter]">{formattedDate}</h4>
       </div>
        </div>
       
     </header>
    )
}
export default Header
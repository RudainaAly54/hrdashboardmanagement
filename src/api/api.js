import createCrud from "../lib/supabaseCrud"
const employeeCRUD = createCrud("Employees");
const departmentCRUD = createCrud("Departments")
const attendanceCRUD = createCrud("Attendance")
const leaveRequestCRUD = createCrud("LeaveRequests")
const payrollCRUD = createCrud("Payroll")
const hrCRUD = createCrud("HRemp")
const settingsCRUD = createCrud("CompanySettings")

export {employeeCRUD, departmentCRUD, attendanceCRUD, leaveRequestCRUD, payrollCRUD, hrCRUD, settingsCRUD}
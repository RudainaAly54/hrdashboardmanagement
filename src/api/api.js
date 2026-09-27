import createCrud from "../lib/supabaseCrud"
const employeeCRUD = createCrud("Employees");
const departmentCRUD = createCrud("Departments")
const attendanceCRUD = createCrud("Attendance")
const leaveRequestCRUD = createCrud("LeaveRequests")
const payrollCRUD = createCrud("Payroll")

export {employeeCRUD, departmentCRUD, attendanceCRUD, leaveRequestCRUD, payrollCRUD}
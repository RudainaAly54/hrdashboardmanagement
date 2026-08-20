import createCrud from "../lib/supabaseCrud"
const employeeCRUD = createCrud("Employees");
const departmentCRUD = createCrud("Departments")
const attendanceCRUD = createCrud("Attendance")
const leaveRequestCRUD = createCrud("LeaveRequests")

export {employeeCRUD, departmentCRUD, attendanceCRUD}
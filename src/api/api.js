import createCrud from "../lib/supabaseCrud"
const employeeCRUD = createCrud("Employees");
const departmentCRUD = createCrud("Departments")
const attendanceCRUD = createCrud("Attendance")

export {employeeCRUD, departmentCRUD, attendanceCRUD}
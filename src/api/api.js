import createCrud from "../lib/supabaseCrud"
const employeeCRUD = createCrud("Employees");
const departmentCRUD = createCrud("Departments")

export {employeeCRUD, departmentCRUD}
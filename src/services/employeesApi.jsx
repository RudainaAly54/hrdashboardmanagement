// src/services/employeesApi.js
import { createCrud } from "../lib/supabaseCrud";
export const employeesApi = createCrud("Employees");
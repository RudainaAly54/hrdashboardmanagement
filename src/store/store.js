import {configureStore} from "@reduxjs/toolkit"
import {employeesApi} from "./employeesApi"
import {departmentsApi} from "./departmentsApi"

export const store = configureStore({
    reducer: {
        [employeesApi.reducerPath]: employeesApi.reducer,
        [departmentsApi.reducerPath]: departmentsApi.reducer,
    },
    middleware: (getDefault) => 
        getDefault().concat(employeesApi.middleware, departmentsApi.middleware)
})
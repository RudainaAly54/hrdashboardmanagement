import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { departmentCRUD } from "../api/api";

export const departmentsApi = createApi({
  reducerPath: "departmentsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Department"],
  endpoints: (builder) => ({
    getDepartments: builder.query({
      async queryFn(args) {
        try { return { data: await departmentCRUD.getAll(args) }; }
        catch (error) { return { error: error.message }; }
      },
      providesTags: (result) =>
        result
          ? [...result.map((d) => ({ type: "Department", id: d.id })), { type: "Department", id: "LIST" }]
          : [{ type: "Department", id: "LIST" }],
    }),
    getDepartmentById: builder.query({
      async queryFn(id) {
        try { return { data: await departmentCRUD.getById(id, "id", "*, Employees:headID(fullName, PhotoUrl)") }; }
        catch (error) { return { error: error.message }; }
      },
      providesTags: (r, e, id) => [{ type: "Department", id }],
    }),
    createDepartment: builder.mutation({
      async queryFn(payload) {
        try { return { data: await departmentCRUD.create(payload) }; }
        catch (error) { return { error: error.message }; }
      },
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
    updateDepartment: builder.mutation({
      async queryFn({ id, payload }) {
        try { return { data: await departmentCRUD.update(id, payload) }; }
        catch (error) { return { error: error.message }; }
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Department", id }, { type: "Department", id: "LIST" }],
    }),
    deleteDepartment: builder.mutation({
      async queryFn(id) {
        try { await departmentCRUD.remove(id); return { data: id }; }
        catch (error) { return { error: error.message }; }
      },
      // deleting a dept can change employees' department linkage too
      invalidatesTags: (r, e, id) => [{ type: "Department", id }, { type: "Department", id: "LIST" }, { type: "Employee", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { employeeCRUD } from "../api/api";

export const employeesApi = createApi({
  reducerPath: "employeesApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Employee"],
  endpoints: (builder) => ({
    getEmployees: builder.query({
      async queryFn(args) {
        try { return { data: await employeeCRUD.getAll(args) }; }
        catch (error) { return { error: error.message }; }
      },
      providesTags: (result) =>
        result
          ? [...result.map((e) => ({ type: "Employee", id: e.id })), { type: "Employee", id: "LIST" }]
          : [{ type: "Employee", id: "LIST" }],
    }),
    getEmployeesPage: builder.query({
      async queryFn(args) {
        try { return { data: await employeeCRUD.getPage(args) }; }
        catch (error) { return { error: error.message }; }
      },
      providesTags: [{ type: "Employee", id: "LIST" }],
    }),
    getEmployeeById: builder.query({
      async queryFn(id) {
        try { return { data: await employeeCRUD.getById(id) }; }
        catch (error) { return { error: error.message }; }
      },
      providesTags: (r, e, id) => [{ type: "Employee", id }],
    }),
    createEmployee: builder.mutation({
      async queryFn(payload) {
        try { return { data: await employeeCRUD.create(payload) }; }
        catch (error) { return { error: error.message }; }
      },
      invalidatesTags: [{ type: "Employee", id: "LIST" }],
    }),
    updateEmployee: builder.mutation({
      async queryFn({ id, payload }) {
        try { return { data: await employeeCRUD.update(id, payload) }; }
        catch (error) { return { error: error.message }; }
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Employee", id }, { type: "Employee", id: "LIST" }],
    }),
    deleteEmployee: builder.mutation({
      async queryFn(id) {
        try { await employeeCRUD.remove(id); return { data: id }; }
        catch (error) { return { error: error.message }; }
      },
      invalidatesTags: (r, e, id) => [{ type: "Employee", id }, { type: "Employee", id: "LIST" }],
    }),
    bulkDeleteEmployees: builder.mutation({
      async queryFn(ids) {
        try{
          await Promise.all(ids.map((id) => employeeCRUD.remove(id)));
          return {data: ids}
        }
        catch (error) {return {error: error.message}}
      },
      invalidatesTags: (r, e, ids) => [
        ...ids.map((id) => ({type: "Employee", id})),
        {type: "Employee", id: "LISY"}
      ]
    })
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeesPageQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useBulkDeleteEmployeesMutation
} = employeesApi;
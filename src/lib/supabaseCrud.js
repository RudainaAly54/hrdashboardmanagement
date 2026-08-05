import { filter } from 'framer-motion/m';
import {createClient} from './supabaseClient';

const supabase = createClient(); 

const createCrud = (tableName) => {
    return { 
        //Read All Records.
        //Filters / Order => Optional
       getAll: async ({ orderBy, ascending = true, filters = {}, selectQuery = "*" } = {}) => {
    let query = supabase.from(tableName).select(selectQuery);

    Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
    });

    if (orderBy) query = query.order(orderBy, { ascending });

    const { data, error } = await query;
    if (error) throw error;
    return data;
},



    //Paginated read - search / pagination
 // Read Specific Record by ID
getPage : async({
    page = 1, 
    pageSize = 10,
    orderBy, 
    ascending = true, 
    filters = {},
    searchColumn, 
    searchTerm,
    selectQuery = "*"
} = {}) => {
    const from = (page -1) * pageSize;
    const to = from + pageSize -1

    let query = supabase
    .from(tableName)
    .select(selectQuery, {count: "exact"})
    .range(from, to);

    if(orderBy) query = query.order(orderBy, {ascending});
    if(searchTerm && searchColumn) query = query.ilike(searchColumn, `%${searchTerm}%`);

    Object.entries(filters).forEach(([key, value]) => {
        if(value !== null &&  value !==undefined && value !== "") {
            query = query.eq(key, value);
        }
    });

    const {data, error, count} = await query;

    if(error) throw error;
    return {data, count: count ?? 0};
},


    getById : async (id, idColumn = "id") => {
        const {data, error}  = await supabase
        .from(tableName)
        .select("*")
        .eq(idColumn, id)
        .single();

        if(error) throw error
        return data
    },

    //Create New Record
    create : async(payload) => {
        const {data, error} = await supabase
        .from(tableName)
        .insert(payload)
        .select();

        if(error) throw error
        return data[0];
    },

    //Update existing record by id
    update: async(id, payload, idColumn = "id") => {
        const {data, error} = await supabase
        .from(tableName)
        .update(payload)
        .eq(idColumn, id)
        .select();

        if(error) throw error
        return data[0]
    },

    //Remove a record by id
    remove: async (id, idColumn = "id") => {
        const {error} = await supabase
        .from(tableName)
        .delete()
        .eq(idColumn, id);

        if(error) throw error;
        return true;
    },


    //Count => Summarizes
   count: async (filters = {}) => {
    let query = supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

    Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
},

    }
}


export default createCrud;
import {supabase} from './supabaseClient';

export const createCrud = (tableName) => {
    return { 
        //Read All Records.
        //Filters / Order => Optional
       getAll: async ({ orderBy, ascending = true, filters = {} } = {}) => {
      let query = supabase.from(tableName).select("*");

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (orderBy) query = query.order(orderBy, { ascending });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    // Read Specific Record by ID
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
    }
    }
}
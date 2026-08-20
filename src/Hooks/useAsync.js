import { useState, useEffect, useCallback } from "react";

//Runs Async Function
export const useAsync = (asyncFn, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await asyncFn ()
            setData(result)
        } catch (err) {
            console.error(err)
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }, dependencies)

    useEffect(() => {
        execute()
    }, [execute])

return {data, setData, loading, error, refetch: execute}
}
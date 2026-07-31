import { createContext, useContext, useEffect, useState } from "react";
import  {supabase} from "../lib/supabaseClaint";
const AuthContext = createContext(null);

export const AuthProvider= ({children}) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (useId) => {
        const {data} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', useId)
        .single();
        setProfile(data);
    }

    useEffect(() => {
        supabase.auth.getSession().then(({data: {session}} )=> {
            setUser(session?.user ?? null);
            if(session?.user) loadProfile(session.user.id);
            setLoading(false)
        });

        const {data: listener} = supabase.auth.onAuthStateChange((_event, session) =>{
            setUser(session?.user ?? null);
            if(session?.user) loadProfile(session.user.id);
            else setProfile(null);
        });

        return () => listener.subscription.unsubscribe();
    },[])

    //  lOGIN & LOGOUT
   const login = (email, password) => 
    supabase.auth.signInWithPassword({email, password});

const logout = () => supabase.auth.signOut();



const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

const updatePassword = (newPassword) =>
    supabase.auth.updateUser({ password: newPassword });

return (
    <AuthContext.Provider
    value={{user, profile, loading, login, logout,  resetPassword, updatePassword}}
    >
        {children}
    </AuthContext.Provider>
)
}

export const useAuth = () => useContext(AuthContext);
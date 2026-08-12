import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "../lib/supabaseClient";// match your actual filename

const supabase = createClient();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [hrProfile, setHrProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadHrProfile = async (userId) => {
        const { data } = await supabase
            .from('HRemp')
            .select('*')
            .eq('auth_user_id', userId)
            .single();
        setHrProfile(data ?? null);
    };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) loadHrProfile(session.user.id); 
        setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadHrProfile(session.user.id); 
        else setHrProfile(null);
    });

    return () => listener.subscription.unsubscribe();
}, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { error: { message: "Incorrect email or password. Please check your details and try again." } };
        }

        const { data: hrRow, error: hrError } = await supabase
            .from('HRemp')
            .select('HRid')
            .eq('auth_user_id', data.user.id)
            .single();

        // .single() returns an error (PGRST116) rather than hrRow: null when no
        // matching row exists — that's the "valid login, not an HR account" case,
        // not an unexpected failure, so it gets the friendly unauthorized message too.
        const isNoRowFound = hrError?.code === 'PGRST116';

        if (hrError && !isNoRowFound) return { error: hrError };

        if (!hrRow || isNoRowFound) {
            await supabase.auth.signOut();
            return { error: { message: "This account isn't authorized for HR access. Contact your system administrator if you believe this is a mistake." } };
        }

        return { error: null }; 
    };

    const logout = () => supabase.auth.signOut();

    const resetPassword = (email) =>
        supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

    const updatePassword = (newPassword) =>
        supabase.auth.updateUser({ password: newPassword });

    return (
        <AuthContext.Provider
            value={{ user, hrProfile, loading, login, logout, resetPassword, updatePassword }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
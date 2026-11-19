import { translations } from "../lib/translations";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
export const LANGUAGES = [
    { code: "en", label: "English (United States)" },
    { code: "es", label: "Spanish (ES)" },
    { code: "fr", label: "French (FR)" },
    { code: "de", label: "German (DE)" },
];

const read = (key, fallback, allowed) => {
    try {
        const v = localStorage.getItem(key)
        return allowed.includes(v) ? v : fallback
    } catch {
        return fallback
    }
}
const PreferencesContext = createContext(null)

export const PreferencesProvider = ({children}) => {
    const [theme, setThemeState] = useState(() => read("hr_theme", "light", ["light", "dark"]))
    const [language, setLanguageState] = useState(() => read("hr_language", "en", LANGUAGES.map(l => l.code)))
    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark")
        try { localStorage.setItem("hr_theme", theme) } catch { /* storage unavailable */ }
    }, [theme])

    useEffect(() => {
        document.documentElement.lang = language
        try { localStorage.setItem("hr_language", language) } catch { /* storage unavailable */ }
    }, [language])

    // t(key) | t(key, "fallback") | t(key, { name: "x" }) for {name} placeholders
    const t = useCallback((key, opts) => {
        const fallback = typeof opts === "string" ? opts : undefined
        let text = translations[language]?.[key] ?? translations.en[key] ?? fallback ?? key
        if (opts && typeof opts === "object") {
            Object.entries(opts).forEach(([k, v]) => { text = text.replaceAll(`{${k}}`, v) })
        }
        return text
    }, [language])

        return(
            <PreferencesContext.Provider value={{theme, setTheme:setThemeState, language, 
                setLanguage: setLanguageState,  t}}>
                    {children}
                     </PreferencesContext.Provider>
        )
}

export const usePreferences = () => useContext(PreferencesContext)
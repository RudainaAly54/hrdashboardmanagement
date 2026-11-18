import { createContext, useContext, useEffect, useState, useCallback, Children } from "react";
import { useToast } from "./ToastContext";
export const LANGUAGES = [
    { code: "en", label: "English (United States)" },
    { code: "es", label: "Spanish (ES)" },
    { code: "fr", label: "French (FR)" },
    { code: "de", label: "German (DE)" },
];

const translations = {
    en: {
        "nav.dashboard": "Dashboard", "nav.employees": "Employees", "nav.departments": "Departments",
        "nav.attendance": "Attendance", "nav.leave": "Leave Request", "nav.payroll": "Payroll",
        "nav.reports": "Reports", "nav.settings": "Settings",
        "settings.title": "Settings",
        "settings.subtitle": "Manage your global enterprise configurations and team permissions.",
        "tab.company": "Company Profile", "tab.managers": "HR Managers", "tab.system": "System Preferences",
        "system.comm": "Communication Prefs", "system.appearance": "Interface Appearance",
        "system.email": "Email Notifications", "system.emailDesc": "Receive daily summaries and alerts",
        "system.slack": "Slack Integration", "system.slackDesc": "Sync alerts to #hr-internal channel",
        "system.push": "Real-time Push", "system.pushDesc": "Critical system maintenance alerts",
        "system.light": "Light Mode", "system.dark": "Dark Mode", "system.language": "Interface Language",
        "action.discard": "Discard Changes", "action.save": "Save Enterprise Settings", "action.saving": "Saving...",
    },
    es: {
        "nav.dashboard": "Panel", "nav.employees": "Empleados", "nav.departments": "Departamentos",
        "nav.attendance": "Asistencia", "nav.leave": "Solicitudes de permiso", "nav.payroll": "Nómina",
        "nav.reports": "Informes", "nav.settings": "Configuración",
        "settings.title": "Configuración",
        "settings.subtitle": "Gestione la configuración global de la empresa y los permisos del equipo.",
        "tab.company": "Perfil de empresa", "tab.managers": "Gerentes de RR. HH.", "tab.system": "Preferencias del sistema",
        "system.comm": "Preferencias de comunicación", "system.appearance": "Apariencia de la interfaz",
        "system.email": "Notificaciones por correo", "system.emailDesc": "Recibe resúmenes y alertas diarias",
        "system.slack": "Integración con Slack", "system.slackDesc": "Sincroniza alertas con el canal #hr-internal",
        "system.push": "Notificaciones en tiempo real", "system.pushDesc": "Alertas críticas de mantenimiento",
        "system.light": "Modo claro", "system.dark": "Modo oscuro", "system.language": "Idioma de la interfaz",
        "action.discard": "Descartar cambios", "action.save": "Guardar configuración", "action.saving": "Guardando...",
    },
    fr: {
        "nav.dashboard": "Tableau de bord", "nav.employees": "Employés", "nav.departments": "Départements",
        "nav.attendance": "Présence", "nav.leave": "Demandes de congé", "nav.payroll": "Paie",
        "nav.reports": "Rapports", "nav.settings": "Paramètres",
        "settings.title": "Paramètres",
        "settings.subtitle": "Gérez les configurations globales de l'entreprise et les autorisations de l'équipe.",
        "tab.company": "Profil de l'entreprise", "tab.managers": "Responsables RH", "tab.system": "Préférences système",
        "system.comm": "Préférences de communication", "system.appearance": "Apparence de l'interface",
        "system.email": "Notifications par e-mail", "system.emailDesc": "Recevez des résumés et alertes quotidiens",
        "system.slack": "Intégration Slack", "system.slackDesc": "Synchronise les alertes vers #hr-internal",
        "system.push": "Notifications en temps réel", "system.pushDesc": "Alertes critiques de maintenance",
        "system.light": "Mode clair", "system.dark": "Mode sombre", "system.language": "Langue de l'interface",
        "action.discard": "Annuler les modifications", "action.save": "Enregistrer les paramètres", "action.saving": "Enregistrement...",
    },
    de: {
        "nav.dashboard": "Dashboard", "nav.employees": "Mitarbeiter", "nav.departments": "Abteilungen",
        "nav.attendance": "Anwesenheit", "nav.leave": "Urlaubsanträge", "nav.payroll": "Gehaltsabrechnung",
        "nav.reports": "Berichte", "nav.settings": "Einstellungen",
        "settings.title": "Einstellungen",
        "settings.subtitle": "Verwalten Sie globale Unternehmenseinstellungen und Teamberechtigungen.",
        "tab.company": "Firmenprofil", "tab.managers": "HR-Manager", "tab.system": "Systemeinstellungen",
        "system.comm": "Kommunikation", "system.appearance": "Oberflächendesign",
        "system.email": "E-Mail-Benachrichtigungen", "system.emailDesc": "Tägliche Zusammenfassungen und Warnungen erhalten",
        "system.slack": "Slack-Integration", "system.slackDesc": "Warnungen mit #hr-internal synchronisieren",
        "system.push": "Echtzeit-Push", "system.pushDesc": "Kritische Wartungshinweise",
        "system.light": "Heller Modus", "system.dark": "Dunkler Modus", "system.language": "Oberflächensprache",
        "action.discard": "Änderungen verwerfen", "action.save": "Einstellungen speichern", "action.saving": "Speichern...",
    },
}

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
    const {showToast} = useToast
    const [theme, setThemeState] = useState(() => read("hr_theme", "light", ["light", "dark"]))
    const [language, setLanguageState] = useState(() => read("hr_language", "en", LANGUAGES.map(l => l.code)))
    useEffect(() => {
        document.documentElement.lang = language
        try {
            localStorage.setItem("hr_language", language)
        } catch {
            showToast("Storage unavailable", "error")
        }
    }, [language])

    const t = useCallback(
        key => translations[language]?.[key] ?? translations.en[key] ?? key, 
        [language]  )

        return(
            <PreferencesContext.Provider value={{theme, setTheme:setThemeState, language, 
                setLanguage: setLanguageState,  t}}>
                    {children}
                     </PreferencesContext.Provider>
        )
}

export const usePreferences = () => useContext(PreferencesContext)
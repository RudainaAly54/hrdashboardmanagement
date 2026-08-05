import * as LucideIcons from "lucide-react";

// Lucide's kebab-case icon names ("brain-circuit") need to become
// PascalCase component names ("BrainCircuit") to look them up.
// Numeric segments (the "2" in "code-2") are left as-is, matching
// Lucide's own naming convention for icons like <Code2 />.
const toPascalCase = (str) =>
    str
        .split("-")
        .map((part) => (isNaN(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join("");

const IconsComp = ({ iconName, ...props }) => {
    const pascalName = toPascalCase(iconName || "");
    const IconComponent = LucideIcons[pascalName] || LucideIcons.Users; // graceful fallback

    return <IconComponent {...props} />;
};

export default IconsComp;
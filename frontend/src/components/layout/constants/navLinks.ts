import { Plus, Users, Workflow, Settings, Sparkles } from "lucide-react";
import type { NavLinkItem, AuthButton } from "../types";

export const navLinks: NavLinkItem[] = [
    {
        to: "/",
        label: "Builder",
        icon: Plus
    },
    {
        to: "/agents",
        label: "Agents",
        icon: Users
    },
    {
        to: "/workflows",
        label: "Workflows",
        icon: Workflow
    },
    {
        to: "/integrations",
        label: "Integrations",
        icon: Settings
    }
];

export const authButtons: AuthButton[] = [
    {
        to: "/auth/signin",
        label: "Sign In",
        variant: "secondary"
    },
    {
        to: "/auth/signup",
        label: "Sign Up",
        icon: Sparkles,
        variant: "primary",
        showArrow: true
    }
];


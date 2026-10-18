import type { LucideIcon } from "lucide-react";

export interface NavLinkItem {
    to: string;
    label: string;
    icon: LucideIcon;
}

export interface AuthButton {
    to: string;
    label: string;
    icon?: LucideIcon;
    variant: "primary" | "secondary";
    showArrow?: boolean;
}


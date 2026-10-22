import type { LucideIcon } from "lucide-react"
import { Cloud, Hash, Linkedin, Mail, Plug } from "lucide-react"
import {
  siAirtable,
  siAsana,
  siCalendly,
  siDiscord,
  siDropbox,
  siFigma,
  siGithub,
  siGmail,
  siGooglecalendar,
  siGoogledocs,
  siGoogledrive,
  siGooglesheets,
  siHubspot,
  siIntercom,
  siJira,
  siLinear,
  siMailchimp,
  siNotion,
  siShopify,
  siStripe,
  siTelegram,
  siTodoist,
  siTrello,
  siWhatsapp,
  siX,
  siYoutube,
  siZoom,
  type SimpleIcon,
} from "simple-icons"

import { cn } from "@/lib/utils"

// Real brand logos from simple-icons (CC0), drawn in currentColor so they stay white on glass.
// Brands that asked simple-icons to remove their logo fall back to a lucide icon.
const BRANDS: Record<string, SimpleIcon | LucideIcon> = {
  airtable: siAirtable,
  asana: siAsana,
  calendly: siCalendly,
  discord: siDiscord,
  dropbox: siDropbox,
  figma: siFigma,
  github: siGithub,
  gmail: siGmail,
  googlecalendar: siGooglecalendar,
  googledocs: siGoogledocs,
  googledrive: siGoogledrive,
  googlesheets: siGooglesheets,
  hubspot: siHubspot,
  intercom: siIntercom,
  jira: siJira,
  linear: siLinear,
  mailchimp: siMailchimp,
  notion: siNotion,
  shopify: siShopify,
  stripe: siStripe,
  telegram: siTelegram,
  todoist: siTodoist,
  trello: siTrello,
  whatsapp: siWhatsapp,
  x: siX,
  youtube: siYoutube,
  zoom: siZoom,
  // Not in simple-icons
  slack: Hash,
  outlook: Mail,
  salesforce: Cloud,
  linkedin: Linkedin,
}

/** "Google Calendar", "GOOGLECALENDAR", "google_calendar" -> "googlecalendar" */
export function brandKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function hasBrandIcon(name: string) {
  return brandKey(name) in BRANDS
}

export interface BrandIconProps {
  name: string
  size?: number
  className?: string
  /** Shown when the brand is unknown */
  fallback?: LucideIcon
}

export function BrandIcon({ name, size = 20, className, fallback: Fallback = Plug }: BrandIconProps) {
  const icon = BRANDS[brandKey(name)]
  if (icon && "path" in icon) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={cn("shrink-0", className)} aria-hidden="true">
        <path d={icon.path} />
      </svg>
    )
  }
  const Lucide = (icon as LucideIcon | undefined) ?? Fallback
  return <Lucide size={size} strokeWidth={1.7} className={cn("shrink-0", className)} aria-hidden="true" />
}

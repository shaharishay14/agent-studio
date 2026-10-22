import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Link, NavLink, useLocation } from "react-router-dom"
import { Bot, Menu, Plug, Sparkles, Workflow, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, IconButton } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { useUserStore } from "../../../store/user.store"
import { AccountMenu } from "./AccountMenu"
import { APP_LINKS } from "./navLinks"

const ICONS: Record<string, ReactNode> = {
  "/builder": <Sparkles />,
  "/agents": <Bot />,
  "/workflows": <Workflow />,
  "/integrations": <Plug />,
}

const SLOT_ID = "app-top-bar-slot"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-medium no-underline transition-colors [&_svg]:size-4 [&_svg]:stroke-[1.7]",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
    isActive ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]" : "text-white/72 hover:bg-white/8 hover:text-white"
  )

// App top bar: logo, Builder / Agents / Workflows / Integrations pills, a slot for page actions
// (e.g. the agents search), and the account button. Sticky, dark glass.
export function AppTopBar() {
  const { isAuthenticated } = useUserStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night/70 backdrop-blur-[20px] backdrop-saturate-150">
      <div className="flex items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link to="/" aria-label="Agent Studio home" className="rounded-pill no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">
          <Logo />
        </Link>

        <nav aria-label="App" className="mx-auto hidden gap-1 md:flex">
          {APP_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {ICONS[l.to]}
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2.5 md:ml-0">
          <div id={SLOT_ID} className="flex min-w-0 items-center" />
          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <Link to="/auth/signin" className={buttonVariants({ variant: "white", size: "sm" })}>
              Sign in
            </Link>
          )}
          <IconButton
            className="md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="app-mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </IconButton>
        </div>
      </div>

      {mobileOpen && (
        <nav id="app-mobile-menu" aria-label="App" className="flex animate-sky-in flex-col gap-1 border-t border-white/10 p-3 md:hidden">
          {APP_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={(s) => cn(linkClass(s), "h-11 px-4")}>
              {ICONS[l.to]}
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

// Render page-specific controls (search, filters) into the top bar
export function TopBarSlot({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => setTarget(document.getElementById(SLOT_ID)), [])
  return target ? createPortal(children, target) : null
}

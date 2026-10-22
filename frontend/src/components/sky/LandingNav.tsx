import { useEffect, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { Bolt, Menu, Plug, ShieldCheck, Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants, IconButton } from "@/components/ui/button"
import { IconCircle } from "@/components/ui/icon-circle"
import { Logo } from "@/components/ui/logo"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useUserStore } from "../../../store/user.store"
import { AccountMenu } from "./AccountMenu"
import { APP_LINKS } from "./navLinks"

const PRODUCT = [
  { label: "Builder", text: "Describe an agent in one sentence", href: "#how", icon: Sparkles },
  { label: "Workflows", text: "Chain agents step by step", to: "/workflows", icon: Bolt },
  { label: "Integrations", text: "Gmail, WhatsApp, Telegram and more", to: "/integrations", icon: Plug },
  { label: "Approvals", text: "Nothing sends without your OK", href: "#how-approve", icon: ShieldCheck },
]

const SECTIONS = [
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]


const pillLink = cn(navigationMenuTriggerStyle(), "no-underline")
const activePill = "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]"

// Glass pill bar over the hero. Logged out: Product dropdown + page sections, Sign in / Start free.
// Logged in: app links + account menu.
export function LandingNav() {
  const { isAuthenticated } = useUserStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash])

  return (
    <header className="sky-glass relative z-30 mx-auto flex w-full max-w-[1080px] items-center gap-5 rounded-pill py-2 pr-2 pl-[18px]">
      <Link to="/" aria-label="Agent Studio home" className="rounded-pill no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white">
        <Logo />
      </Link>

      <NavigationMenu viewport={false} aria-label="Main" className="mx-auto hidden md:flex">
        <NavigationMenuList>
          {isAuthenticated ? (
            APP_LINKS.map((l) => (
              <NavigationMenuItem key={l.to}>
                <NavigationMenuLink asChild>
                  <NavLink to={l.to} className={({ isActive }) => cn(pillLink, isActive && activePill)}>
                    {l.label}
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))
          ) : (
            <>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent className="-left-3 md:w-[520px]">
                  <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0">
                    {PRODUCT.map((p) => (
                      <li key={p.label}>
                        <NavigationMenuLink asChild>
                          {p.to ? (
                            <Link to={p.to}>
                              <ProductItem {...p} />
                            </Link>
                          ) : (
                            <a href={p.href}>
                              <ProductItem {...p} />
                            </a>
                          )}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {SECTIONS.map((s) => (
                <NavigationMenuItem key={s.href}>
                  <NavigationMenuLink asChild>
                    <a href={s.href} className={pillLink}>
                      {s.label}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        {isAuthenticated ? (
          <AccountMenu />
        ) : (
          <>
            <Link to="/auth/signin" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
              Sign in
            </Link>
            <Link to="/auth/signup" className={buttonVariants({ variant: "white", size: "sm" })}>
              Start free
            </Link>
          </>
        )}
        <IconButton
          className="md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </IconButton>
      </div>

      {mobileOpen && (
        <nav
          id="landing-mobile-menu"
          aria-label="Main"
          className="absolute top-[calc(100%+12px)] right-0 left-0 flex animate-sky-in flex-col gap-1 rounded-3xl border border-white/25 bg-night-2 p-2.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] md:hidden"
        >
          {isAuthenticated
            ? APP_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => cn(mobileLink, isActive && "bg-white/12 text-white")}>
                  {l.label}
                </NavLink>
              ))
            : [...PRODUCT.filter((p) => p.to), ...SECTIONS].map((l) =>
                "to" in l && l.to ? (
                  <Link key={l.label} to={l.to} className={mobileLink}>
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.label} href={"href" in l ? l.href : undefined} className={mobileLink} onClick={() => setMobileOpen(false)}>
                    {l.label}
                  </a>
                )
              )}
          {!isAuthenticated && (
            <Link to="/auth/signin" className={cn(mobileLink, "sm:hidden")}>
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}

const mobileLink = "rounded-2xl px-4 py-3 text-[15px] font-medium text-white/85 no-underline hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-white"

function ProductItem({ label, text, icon: Icon }: { label: string; text: string; icon: typeof Bolt }) {
  return (
    <>
      <IconCircle>
        <Icon />
      </IconCircle>
      <span>
        <b className="block text-sm font-semibold">{label}</b>
        <small className="block text-[13px] leading-[18px] text-white/72">{text}</small>
      </span>
    </>
  )
}

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { SocialIcon } from "./icon-circle"
import { LogoMark } from "./logo"

// Stacked circular footer (21st.dev arihantcodes_1f7b8c4d/stacked-circular-footer, Sky version):
// round glass ring with the logo, links row, round social icons, glass email pill with
// a white Subscribe button, copyright.
export interface FooterLink {
  label: string
  href: string
  external?: boolean
}

export interface FooterSocial {
  label: string
  href: string
  icon: React.ReactNode
}

export interface StackedCircularFooterProps {
  links: FooterLink[]
  socials: FooterSocial[]
  legal: React.ReactNode
  onSubscribe?: (email: string) => void
  renderLink?: (link: FooterLink, className: string) => React.ReactNode
  className?: string
}

const linkClass = "text-white/78 no-underline transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white rounded-sm"

export function StackedCircularFooter({ links, socials, legal, onSubscribe, renderLink, className }: StackedCircularFooterProps) {
  const [email, setEmail] = React.useState("")
  const emailId = React.useId()

  return (
    <footer
      className={cn(
        "flex flex-col items-center gap-[26px] rounded-card border border-white/12 bg-night-2 px-6 py-14 text-center",
        className
      )}
    >
      <span className="sky-glass grid size-[104px] place-items-center rounded-pill">
        <LogoMark size={52} />
      </span>
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-7 gap-y-3">
        {links.map((link) =>
          renderLink && !link.external ? (
            <React.Fragment key={link.label}>{renderLink(link, linkClass)}</React.Fragment>
          ) : (
            <a
              key={link.label}
              href={link.href}
              className={linkClass}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {link.label}
            </a>
          )
        )}
      </nav>
      {socials.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {socials.map((s) => (
            <SocialIcon key={s.label} href={s.href} aria-label={s.label} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {s.icon}
            </SocialIcon>
          ))}
        </div>
      )}
      {onSubscribe && (
        <form
          className="sky-glass flex w-full max-w-[420px] items-center gap-1.5 rounded-pill py-[5px] pr-[5px] pl-[18px]"
          onSubmit={(e) => {
            e.preventDefault()
            if (!email.trim()) return
            onSubscribe(email.trim())
            setEmail("")
          }}
        >
          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Get release notes by email"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
          />
          <Button type="submit" size="sm">
            Subscribe
          </Button>
        </form>
      )}
      <p className="m-0 text-[13px] text-white/72">{legal}</p>
    </footer>
  )
}

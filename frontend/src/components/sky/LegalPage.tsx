import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { HeaderBand } from "./HeaderBand"

// Shell for the legal pages (they sit outside the app shell): logo + back, dusk header, one night panel
export function LegalPage({ title, accent, subtitle, children }: { title: string; accent: string; subtitle: string; children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-night text-white">
      <div className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <a href="/" className="rounded-pill no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <Logo />
        </a>
        <Button variant="glass" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      {/* Room for the logo bar above the title */}
      <div className="[&>section]:pt-24">
        <HeaderBand eyebrow="Legal" title={title} accent={accent} subtitle={subtitle} />
      </div>

      <main className="mx-auto max-w-[860px] px-4 pb-20 sm:px-6">
        <article className="flex flex-col gap-8 rounded-card border border-white/12 bg-night-2 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-10">
          {children}
        </article>
      </main>
    </div>
  )
}

import type { ReactNode } from 'react'

// Solid night panel for a settings group
export const SettingsPanel = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section className="flex flex-col gap-2 rounded-card border border-white/12 bg-night-2 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" aria-label={title}>
    <div className="mb-1 flex items-center gap-2">
      <h2 className="m-0 flex-1 font-display text-[22px] leading-7 font-medium tracking-[-0.02em]">{title}</h2>
      {action}
    </div>
    {children}
  </section>
)

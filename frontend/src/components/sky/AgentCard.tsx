import type { MouseEventHandler } from "react"
import { Link } from "react-router-dom"
import { Plus, Share2, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { IconButton } from "@/components/ui/button"
import { AgentAvatar } from "./AgentAvatar"

export interface AgentCardData {
  id: string
  name: string
  prompt: string
  created_at: string
  message_count: number
  avatar_base64?: string | null
}

const cardClass = cn(
  "relative flex flex-col gap-3.5 rounded-[26px] border border-white/14 bg-linear-to-b from-white/8 to-white/3 p-[22px] text-white",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-[border-color,transform,background-color] duration-200"
)

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export function relativeDate(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (Math.abs(days) < 7) return rtf.format(days, "day")
  if (Math.abs(days) < 30) return rtf.format(Math.round(days / 7), "week")
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month")
  return rtf.format(Math.round(days / 365), "year")
}

// Glass agent card: avatar, name, 2-line prompt, date, message count badge, share / delete.
// The whole card links to the chat; the action buttons sit above the link.
export function AgentCard({
  agent,
  onShare,
  onDelete,
}: {
  agent: AgentCardData
  onShare: (agent: AgentCardData) => void
  onDelete: (agent: AgentCardData) => void
}) {
  return (
    <article className={cn(cardClass, "group hover:-translate-y-0.5 hover:border-white/35 hover:from-white/11 hover:to-white/4")}>
      <div className="flex items-start justify-between gap-3">
        <AgentAvatar id={agent.id} avatar={agent.avatar_base64} />
        <div className="relative z-10 flex gap-0.5">
          <IconButton size="sm" aria-label={`Share ${agent.name}`} onClick={() => onShare(agent)}>
            <Share2 />
          </IconButton>
          <IconButton size="sm" aria-label={`Delete ${agent.name}`} onClick={() => onDelete(agent)} className="hover:text-off">
            <Trash2 />
          </IconButton>
        </div>
      </div>
      <h3 className="m-0 truncate font-display text-xl leading-[26px] font-medium tracking-[-0.02em]">
        <Link
          to={`/chat/${agent.id}`}
          className="text-white no-underline outline-none after:absolute after:inset-0 after:rounded-[26px] focus-visible:after:outline-2 focus-visible:after:outline-offset-3 focus-visible:after:outline-white"
        >
          {agent.name}
        </Link>
      </h3>
      <p className="m-0 line-clamp-2 text-sm leading-[21px] text-white/70">{agent.prompt}</p>
      <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-white/10 pt-3 text-[13px] text-white/66">
        <span>{relativeDate(agent.created_at)}</span>
        <Badge>
          {agent.message_count.toLocaleString("en")} {agent.message_count === 1 ? "message" : "messages"}
        </Badge>
      </div>
    </article>
  )
}

// Dashed "Describe a new agent" card
export function NewAgentCard({ to = "/builder", onClick }: { to?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        cardClass,
        "min-h-[220px] items-center justify-center gap-3 border-dashed text-white/80 no-underline hover:border-white/35 hover:text-white",
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
      )}
    >
      <span className="inline-grid size-[46px] place-items-center rounded-pill border border-white/35 bg-white/8">
        <Plus className="size-5" strokeWidth={1.7} />
      </span>
      <span className="font-medium">Describe a new agent</span>
    </Link>
  )
}

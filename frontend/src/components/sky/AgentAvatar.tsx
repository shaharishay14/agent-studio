import { Bot } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatAvatarUrl } from "../pages/chat/utils"

// Soft photo tones for agents without an avatar: white, warm cloud, haze, rose.
const TONES = ["#ffffff", "#ffd7a8", "#9fc2e0", "#f3c2b0"]

function toneFor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return TONES[Math.abs(h) % TONES.length]
}

export function AgentAvatar({
  id,
  avatar,
  size = 46,
  className,
}: {
  id: string
  avatar?: string | null
  size?: number
  className?: string
}) {
  const url = formatAvatarUrl(avatar)
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-pill text-on-white", className)}
      style={{ width: size, height: size, background: url ? undefined : toneFor(id) }}
      aria-hidden="true"
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <Bot style={{ width: size * 0.48, height: size * 0.48 }} strokeWidth={1.7} />
      )}
    </span>
  )
}

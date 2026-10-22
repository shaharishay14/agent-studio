import { Link } from "react-router-dom"
import { LogOut, Settings } from "lucide-react"
import { DropdownMenu } from "radix-ui"

import { cn } from "@/lib/utils"
import { useUserStore } from "../../../store/user.store"
import { useLogout } from "../pages/auth/hooks"

const itemClass = cn(
  "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/85 outline-none no-underline",
  "data-highlighted:bg-white/12 data-highlighted:text-white [&_svg]:size-4 [&_svg]:stroke-[1.7]"
)

// Round account button (first letter of the email) with a glass dropdown.
export function AccountMenu({ className }: { className?: string }) {
  const { user } = useUserStore()
  const { logout } = useLogout()
  const initial = user?.email?.charAt(0).toUpperCase() || "U"

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label="Account menu"
        className={cn(
          "inline-grid size-9 shrink-0 place-items-center rounded-pill border border-white/35 bg-white/12 text-sm font-semibold text-white",
          "hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white",
          className
        )}
      >
        {initial}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[60] w-64 animate-sky-in rounded-3xl border border-white/25 bg-night-2 p-2 text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]"
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-3 pt-2 pb-3">
            <span className="inline-grid size-9 shrink-0 place-items-center rounded-pill bg-white text-sm font-semibold text-on-white" aria-hidden="true">
              {initial}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{user?.username || user?.email}</span>
              {user?.username && <span className="truncate text-xs text-white/60">{user.email}</span>}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 pt-2">
            <DropdownMenu.Item asChild className={itemClass}>
              <Link to="/settings">
                <Settings />
                Settings
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={() => logout()}>
              <LogOut />
              Sign out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

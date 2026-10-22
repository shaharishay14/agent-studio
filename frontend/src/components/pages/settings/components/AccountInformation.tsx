import type { ReactNode } from 'react'
import { Crown, Mail, User } from 'lucide-react'

import { useUserStore } from '../../../../../store/user.store'
import { SettingsPanel } from './SettingsPanel'

const Row = ({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) => (
  <div className="flex items-center gap-3.5 border-b border-white/8 py-3.5 last:border-b-0">
    <span className="grid size-9 shrink-0 place-items-center rounded-pill border border-white/25 bg-white/8 text-white/85 [&_svg]:size-4 [&_svg]:stroke-[1.7]" aria-hidden="true">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="m-0 truncate text-[15px] font-medium">{value}</dd>
    </div>
  </div>
)

export const AccountInformation = () => {
  const { user } = useUserStore()

  return (
    <SettingsPanel title="Account">
      <dl className="m-0">
        <Row icon={<User />} label="Username" value={user?.username || 'Not available'} />
        <Row icon={<Mail />} label="Email" value={user?.email || 'Not available'} />
        <Row icon={<Crown />} label="Plan" value="Free" />
      </dl>
    </SettingsPanel>
  )
}

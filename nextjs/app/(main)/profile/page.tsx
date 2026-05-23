"use client"

import { User2, Mail, CalendarDays, BadgeCheck } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, getAvatarGradient, getInitials } from "@/lib/utils"

function ProfileField({
  icon: Icon,
  label,
  value,
  index = 0,
}: {
  icon: React.ElementType
  label: string
  value: string
  index?: number
}) {
  return (
    <div
      className="flex animate-in items-center gap-4 rounded-xl border border-border px-5 py-4 duration-300 fill-mode-both fade-in slide-in-from-bottom-3"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading } = useUser()

  return (
    <div className="flex flex-1 justify-center p-8 pt-16">
      <div className="w-full max-w-lg space-y-10">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={`flex size-28 items-center justify-center rounded-full ${
              user
                ? `bg-gradient-to-br ${getAvatarGradient(user.name)} text-3xl font-bold text-white shadow-lg ring-4 ring-white/20`
                : "bg-muted"
            }`}
          >
            {user ? (
              getInitials(user.name)
            ) : (
              <User2 className="size-14 text-muted-foreground" />
            )}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-44" />
          ) : (
            <h1 className="text-2xl font-semibold">{user?.name}</h1>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-[72px] w-full rounded-xl" />
              <Skeleton className="h-[72px] w-full rounded-xl" />
              <Skeleton className="h-[72px] w-full rounded-xl" />
            </>
          ) : user ? (
            <>
              <ProfileField icon={Mail} label="Email" value={user.email} index={0} />
              <ProfileField
                icon={BadgeCheck}
                label="Email verified"
                value={
                  user.email_verified_at
                    ? formatDateTime(user.email_verified_at)
                    : "Not verified"
                }
                index={1}
              />
              <ProfileField
                icon={CalendarDays}
                label="Member since"
                value={formatDateTime(user.created_at)}
                index={2}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="relative mb-3 shrink-0 overflow-hidden px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/3 to-transparent" />
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25 md:size-9">
              <User2 className="size-4 text-primary md:size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Profile
            </h1>
          </div>
          <p className="pl-0.5 text-sm text-muted-foreground">
            View your account details.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl px-4 pb-6 md:px-6">
        <div className="mb-8 flex animate-in flex-col items-center gap-4 text-center duration-300 fill-mode-both fade-in slide-in-from-bottom-3">
          <div
            className={`flex size-24 items-center justify-center rounded-full md:size-28 ${
              user
                ? `bg-gradient-to-br ${getAvatarGradient(user.name)} text-2xl font-bold text-white shadow-lg ring-4 ring-white/20 md:text-3xl`
                : "bg-muted"
            }`}
          >
            {user ? (
              getInitials(user.name)
            ) : (
              <User2 className="size-12 text-muted-foreground md:size-14" />
            )}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-44" />
          ) : (
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Personal account
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-[72px] w-full rounded-xl" />
              <Skeleton className="h-[72px] w-full rounded-xl" />
              <Skeleton className="h-[72px] w-full rounded-xl" />
            </>
          ) : user ? (
            <>
              <ProfileField
                icon={Mail}
                label="Email"
                value={user.email}
                index={0}
              />
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

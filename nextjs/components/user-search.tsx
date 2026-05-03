"use client"

import { Input } from "@/components/ui/input"

export default function UserSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-4 w-full">
      <Input
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder="Search users by name or email..."
      />
    </div>
  )
}

"use client"

import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

type User = {
  id: number | string
  name: string
  email?: string
}

export default function FriendsList({ users }: { users: User[] }) {
  if (!users.length) {
    return <div className="text-sm text-muted-foreground">No users found.</div>
  }

  return (
    <div className="grid gap-4">
      {users.map((u) => (
        <Card key={u.id}>
          <CardHeader>
            <CardTitle>{u.name}</CardTitle>
            <CardDescription>{u.email}</CardDescription>
          </CardHeader>

          <CardContent>
            <Link
              href={`/profile/${u.id}`}
              className="text-sm text-primary hover:underline"
            >
              View profile
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

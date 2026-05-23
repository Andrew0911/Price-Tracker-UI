import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AVATAR_GRADIENTS = [
  "from-rose-400 to-red-600",
  "from-pink-400 to-rose-600",
  "from-fuchsia-400 to-pink-600",
  "from-purple-400 to-violet-700",
  "from-violet-400 to-indigo-600",
  "from-indigo-400 to-blue-700",
  "from-blue-400 to-cyan-600",
  "from-sky-400 to-blue-600",
  "from-cyan-400 to-teal-600",
  "from-teal-400 to-emerald-600",
  "from-emerald-400 to-green-700",
  "from-lime-400 to-emerald-600",
  "from-yellow-400 to-amber-600",
  "from-amber-400 to-orange-600",
  "from-orange-400 to-red-600",
  "from-stone-400 to-amber-700",
  "from-yellow-500 to-lime-700",
  "from-green-400 to-cyan-600",
  "from-slate-500 to-blue-700",
  "from-neutral-500 to-stone-700",
  "from-red-500 to-orange-700",
  "from-pink-500 to-purple-700",
  "from-cyan-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
]

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

export function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

export function formatDateTime(iso: string) {
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${day}.${month}.${year} ${hours}:${minutes}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

"use client"

import { useCallback } from "react"
import { useNotification } from "@/components/notification"
import type { ApiResponse } from "@/lib/api"

export function useErrorHandler() {
  const { notify } = useNotification()

  const handleError = useCallback((err: unknown) => {
    const apiError = err as ApiResponse

    notify({
      type: "error",
      message: apiError?.message ?? "Something went wrong",
    })
  }, [notify])

  return { handleError }
}

"use client"

import { useNotification } from "@/components/notification"
import type { ApiResponse } from "@/lib/api"

export function useErrorHandler() {
  const { notify } = useNotification()

  function handleError(err: unknown) {
    const apiError = err as ApiResponse

    notify({
      type: "error",
      message: apiError?.message ?? "Something went wrong",
    })
  }

  return { handleError }
}

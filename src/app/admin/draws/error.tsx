'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-2">Something went wrong!</h2>
        <p className="text-sm">{error.message}</p>
      </div>
      <Button
        onClick={() => reset()}
        variant="outline"
      >
        Try again
      </Button>
    </div>
  )
}

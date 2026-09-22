'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, CheckCircle, Loader2 } from 'lucide-react'

export function DrawActions({ drawId, status }: { drawId: string, status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSimulate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/draws/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to simulate')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this draw? This action is irreversible.')) {
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/draws/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to publish')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'published' || status === 'completed') {
    return <span className="text-emerald-500 font-medium text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Published</span>
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'draft' && (
        <Button 
          onClick={handleSimulate} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Simulate
        </Button>
      )}

      {status === 'simulated' && (
        <>
          <Button 
            onClick={handleSimulate} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Re-simulate
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={loading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </>
      )}

      {error && <span className="text-rose-500 text-xs ml-2">{error}</span>}
    </div>
  )
}

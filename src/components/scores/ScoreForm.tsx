'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addScore, editScore } from '@/app/(dashboard)/dashboard/scores/actions'

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
      {pending ? 'Saving...' : isEdit ? 'Update Score' : 'Add Score'}
    </Button>
  )
}

export function ScoreForm({ 
  initialData,
  onSuccess 
}: { 
  initialData?: { id: string, score: number, score_date: string } | null,
  onSuccess?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)



  async function formAction(formData: FormData) {
    setError(null)
    
    let res;
    if (initialData) {
      res = await editScore(initialData.id, formData)
    } else {
      res = await addScore(formData)
    }

    if (res?.error) {
      setError(res.error)
    } else {
      formRef.current?.reset()
      if (onSuccess) onSuccess()
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="score_date">Golf Date</Label>
        <Input 
          id="score_date" 
          name="score_date" 
          type="date" 
          required 
          defaultValue={initialData?.score_date || ''}
          max={new Date().toISOString().split('T')[0]} // Cannot add future dates
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="score">Stableford Score (1-45)</Label>
        <Input 
          id="score" 
          name="score" 
          type="number" 
          min="1" 
          max="45" 
          required 
          defaultValue={initialData?.score || ''}
        />
      </div>

      <SubmitButton isEdit={!!initialData} />
    </form>
  )
}

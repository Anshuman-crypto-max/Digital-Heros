'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ClaimPrize({ drawResultId, userId, existingClaim }: { drawResultId: string, userId: string, existingClaim?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  if (existingClaim) {
    return (
      <div className="flex items-center text-sm font-medium">
        {existingClaim.verification_status === 'pending' && <span className="text-amber-400">Claim pending review</span>}
        {existingClaim.verification_status === 'approved' && existingClaim.payout_status === 'pending' && <span className="text-emerald-400 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Claim approved (Pending Payout)</span>}
        {existingClaim.verification_status === 'approved' && existingClaim.payout_status === 'paid' && <span className="text-emerald-400 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Prize Paid</span>}
        {existingClaim.verification_status === 'rejected' && <span className="text-rose-400">Claim rejected</span>}
      </div>
    )
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Upload file to winner_proofs bucket
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${drawResultId}-${Math.random()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('winner_proofs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Insert winner_claim using the path since the bucket is private
      const { error: insertError } = await (supabase.from('winner_claims') as any)
        .insert({
          draw_result_id: drawResultId,
          user_id: userId,
          proof_url: uploadData.path,
          verification_status: 'pending'
        })

      if (insertError) throw insertError

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        id={`proof-${drawResultId}`} 
        className="hidden" 
        accept="image/*,.pdf"
        onChange={handleUpload}
        disabled={loading}
      />
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 text-xs cursor-pointer relative"
      >
        <label htmlFor={`proof-${drawResultId}`} className="flex items-center cursor-pointer w-full h-full absolute inset-0 justify-center">
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
          Upload Proof to Claim
        </label>
      </Button>
      {error && <div className="text-rose-400 text-xs mt-1">{error}</div>}
    </div>
  )
}

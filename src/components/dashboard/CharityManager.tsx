'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Charity } from '@/components/charities/CharityCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserCharity } from '@/app/(dashboard)/dashboard/charity-actions'
import { Heart, Loader2 } from 'lucide-react'

export function CharityManager({ 
  currentSelectedCharityId, 
  currentPercentage,
  availableCharities 
}: { 
  currentSelectedCharityId: string | null
  currentPercentage: number | null
  availableCharities: Charity[]
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedId, setSelectedId] = useState<string>(currentSelectedCharityId || '')
  const [percentage, setPercentage] = useState<string>(
    currentPercentage ? currentPercentage.toString() : '10'
  )

  const selectedCharity = availableCharities.find(c => c.id === currentSelectedCharityId)

  const handleSave = async () => {
    setError(null)
    const pct = parseFloat(percentage)
    
    if (!selectedId) {
      setError('Please select a charity.')
      return
    }
    
    if (isNaN(pct) || pct < 10 || pct > 100) {
      setError('Contribution percentage must be between 10% and 100%.')
      return
    }

    setIsLoading(true)
    const result = await updateUserCharity(selectedId, pct)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsEditing(false)
      setIsLoading(false)
      router.refresh()
    }
  }

  if (!isEditing) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {selectedCharity?.image_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedCharity.image_url} 
                  alt={selectedCharity.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg text-blue-500 flex-shrink-0">
                <Heart className="w-8 h-8" />
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Chosen Charity</h2>
              {selectedCharity ? (
                <div className="mt-1">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-900">{selectedCharity.name}</span> 
                    {' '}&middot; {currentPercentage}% of subscription
                  </p>
                  <a 
                    href={`/charities/${selectedCharity.id}`}
                    className="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    View Charity Details
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 mt-1">Choose a charity to support</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button onClick={() => setIsEditing(true)}>
              {selectedCharity ? 'Edit Contribution' : 'Select Charity'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/20 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Charity Preference</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select a Charity
          </label>
          <select 
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="" disabled>Choose an organization...</option>
            {availableCharities.map(charity => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contribution Percentage (Min 10%)
          </label>
          <div className="relative">
            <Input 
              type="number" 
              min="10" 
              max="100"
              step="1"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="pl-3 pr-8"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            At least 10% of your future subscription goes directly to this charity.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preference
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

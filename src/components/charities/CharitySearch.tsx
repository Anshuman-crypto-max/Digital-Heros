'use client'

import { useState } from 'react'
import { CharityCard, Charity } from './CharityCard'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function CharitySearch({ initialCharities }: { initialCharities: Charity[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCharities = initialCharities.filter((charity) => 
    charity.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (charity.description && charity.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      <div className="relative max-w-md mx-auto mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search charities..."
          className="pl-10 h-12 rounded-full border-gray-300 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredCharities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No charities found matching &quot;{searchTerm}&quot;</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharities.map((charity) => (
            <CharityCard key={charity.id} charity={charity} />
          ))}
        </div>
      )}
    </div>
  )
}

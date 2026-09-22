import Link from 'next/link'
import { Heart } from 'lucide-react'

export interface Charity {
  id: string
  name: string
  description: string | null
  image_url: string | null
  website_url: string | null
  upcoming_golf_days: string | null
  is_featured: boolean
}

export function CharityCard({ charity }: { charity: Charity }) {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {charity.image_url ? (
        <div className="w-full h-48 bg-gray-100 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={charity.image_url} 
            alt={charity.name} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-blue-50 flex items-center justify-center text-blue-200">
          <Heart className="w-16 h-16" />
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">{charity.name}</h3>
        
        <p className="text-gray-600 line-clamp-3 text-sm flex-grow mb-6">
          {charity.description || 'No description available.'}
        </p>
        
        <Link 
          href={`/charities/${charity.id}`}
          className="w-full text-center py-2 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors mt-auto"
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

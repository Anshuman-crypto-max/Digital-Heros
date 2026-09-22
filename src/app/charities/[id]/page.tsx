import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Heart, Globe, Calendar, ArrowLeft } from 'lucide-react'
import { Charity } from '@/components/charities/CharityCard'

export const revalidate = 3600 // Revalidate every hour

export default async function CharityDetailPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  const { id } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: charity } = await (supabase.from('charities') as any)
    .select('*')
    .eq('id', id)
    .single()

  if (!charity) {
    notFound()
  }

  const typedCharity = charity as Charity

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link 
          href="/charities" 
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Charities
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {typedCharity.image_url ? (
            <div className="w-full h-64 sm:h-96 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={typedCharity.image_url} 
                alt={typedCharity.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-64 sm:h-96 bg-blue-50 flex items-center justify-center text-blue-200">
              <Heart className="w-24 h-24" />
            </div>
          )}
          
          <div className="p-8 sm:p-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {typedCharity.name}
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-8">
              {typedCharity.website_url && (
                <a 
                  href={typedCharity.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Visit Website
                </a>
              )}
            </div>

            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">About this Charity</h2>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                {typedCharity.description || 'No detailed description available at this time.'}
              </p>
            </div>

            {typedCharity.upcoming_golf_days && (
              <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Upcoming Golf Days</h3>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {typedCharity.upcoming_golf_days}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

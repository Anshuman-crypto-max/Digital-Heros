import { createClient } from '@/lib/supabase/server'
import { CharitySearch } from '@/components/charities/CharitySearch'
import { Charity } from '@/components/charities/CharityCard'

export const revalidate = 3600 // Revalidate every hour

export default async function CharitiesPage() {
  const supabase = await createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: charities } = await (supabase.from('charities') as any)
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')
    
  const typedCharities = (charities || []) as Charity[]

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Our Charities
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Discover and support organizations making a real impact. 
            Choose your preferred charity and we&apos;ll donate a portion of your subscription.
          </p>
        </div>

        <CharitySearch initialCharities={typedCharities} />
      </div>
    </div>
  )
}

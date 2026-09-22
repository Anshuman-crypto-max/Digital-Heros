import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

export default async function AdminCharitiesPage() {
  const supabase = await createClient()

  const { data: charitiesRaw } = await supabase
    .from('charities')
    .select('*')
    .order('created_at', { ascending: false })

  const charities = charitiesRaw as any[] || []

  const toggleCharity = async (formData: FormData) => {
    'use server';
    const id = formData.get('id') as string
    const isActive = formData.get('is_active') === 'true'
    const sb = await createClient()
    await (sb.from('charities') as any).update({ is_active: !isActive }).eq('id', id)
    revalidatePath('/admin/charities')
    revalidatePath('/charities')
  }

  const addCharity = async (formData: FormData) => {
    'use server';
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const sb = await createClient()
    if (name) {
      await (sb.from('charities') as any).insert({ name, description, is_active: true })
      revalidatePath('/admin/charities')
      revalidatePath('/charities')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Charity Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Charity Name</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {charities.map((charity) => (
                  <tr key={charity.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{charity.name}</div>
                      <div className="text-slate-500 text-xs truncate max-w-xs">{charity.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        charity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {charity.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={toggleCharity}>
                        <input type="hidden" name="id" value={charity.id} />
                        <input type="hidden" name="is_active" value={charity.is_active.toString()} />
                        <Button type="submit" variant="outline" size="sm" className={charity.is_active ? "text-rose-600 hover:text-rose-700" : "text-emerald-600 hover:text-emerald-700"}>
                          {charity.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Charity</h2>
            <form action={addCharity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows={3} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                Add Charity
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

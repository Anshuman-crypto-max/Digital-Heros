import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DrawActions } from '@/components/admin/DrawActions'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminDrawsPage() {
  const { requireAdmin } = await import('@/lib/admin');
  const { createAdminClient } = await import('@/lib/supabase/admin');
  
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: rawDraws, error } = await supabase
    .from('draws')
    .select('*')
    .order('draw_month', { ascending: false })

  if (error) {
    console.error('Error fetching draws:', error);
  }

  const draws = rawDraws as any[] || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Draw Management</h1>
        <form action={async () => {
          'use server';
          const { revalidatePath } = await import('next/cache');
          const { requireAdmin } = await import('@/lib/admin');
          const { createAdminClient } = await import('@/lib/supabase/admin');
          
          await requireAdmin();
          
          const adminClient = createAdminClient();
          const nextMonth = new Date();
          nextMonth.setDate(1);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const drawDateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
          
          const { data: existing } = await adminClient
            .from('draws')
            .select('id')
            .eq('draw_month', drawDateStr)
            .maybeSingle();

          if (existing) {
            throw new Error("A draw for this month already exists.");
          }

          const { error } = await (adminClient.from('draws') as any).insert({
            draw_month: drawDateStr,
            draw_date: drawDateStr,
            draw_mode: 'standard',
            status: 'draft'
          });

          if (error) {
            console.error("Failed to create next draw:", error);
            throw new Error("Failed to create next draw: " + error.message);
          }

          revalidatePath('/admin/draws');
        }}>
          <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">
            Create Next Draw
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Draw Month</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {draws.map((draw) => {
                const isPublished = draw.status === 'published' || draw.status === 'completed'
                const date = new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                
                return (
                  <tr key={draw.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <Link href={`/admin/draws/${draw.id}`} className="hover:text-blue-600 underline decoration-slate-300 underline-offset-2">
                        {date}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isPublished ? 'bg-emerald-100 text-emerald-700' : 
                        draw.status === 'simulated' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {draw.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(draw.draw_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <DrawActions drawId={draw.id} status={draw.status} />
                    </td>
                  </tr>
                )
              })}
              
              {draws.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No draws found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

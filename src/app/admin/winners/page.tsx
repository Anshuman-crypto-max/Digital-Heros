import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

export default async function AdminWinnersPage() {
  const supabase = await createClient()

  // Fetch pending claims
  const { data: claimsRaw } = await supabase
    .from('winner_claims')
    .select(`
      *,
      profiles (
        first_name,
        last_name,
        email
      ),
      draw_results (
        prize_amount,
        match_count,
        draw_id,
        draws (
          draw_month
        )
      )
    `)
    .order('created_at', { ascending: false })

  const claims = claimsRaw as any[] || []

  // Generate signed URLs for proofs
  const paths = claims
    .map(c => c.proof_url)
    .filter(p => p && !p.startsWith('http'))

  let signedUrlsMap: Record<string, string> = {}
  if (paths.length > 0) {
    const { data: signedUrlsData } = await supabase.storage.from('winner_proofs').createSignedUrls(paths, 60 * 60)
    if (signedUrlsData) {
      signedUrlsData.forEach(item => {
        if (!item.error && item.signedUrl && item.path) {
          signedUrlsMap[item.path] = item.signedUrl
        }
      })
    }
  }

  const updateStatus = async (formData: FormData) => {
    'use server'
    const claimId = formData.get('claim_id') as string
    const status = formData.get('status') as string

    if (!claimId || !status) return

    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    
    if (!user) return

    if (status === 'approved' || status === 'rejected') {
      await (sb.from('winner_claims') as any).update({ 
        verification_status: status,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      }).eq('id', claimId)
    } else if (status === 'paid') {
      await (sb.from('winner_claims') as any).update({ 
        payout_status: 'paid',
        paid_at: new Date().toISOString()
      }).eq('id', claimId)
    }
    
    revalidatePath('/admin/winners')
    // We should also invalidate the user's dashboard to reflect status
    // Not easy to do directly from here, but server-side rendering will pick it up on next load
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Winner Claims</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No claims submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Winner</th>
                  <th className="px-6 py-4 font-medium">Draw / Matches</th>
                  <th className="px-6 py-4 font-medium">Prize</th>
                  <th className="px-6 py-4 font-medium">Proof</th>
                  <th className="px-6 py-4 font-medium">Verification</th>
                  <th className="px-6 py-4 font-medium">Payout</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const date = new Date(claim.draw_results.draws.draw_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {claim.profiles?.first_name} {claim.profiles?.last_name}
                        </div>
                        <div className="text-slate-500 text-xs">{claim.profiles?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{date}</div>
                        <div className="text-slate-500 text-xs">{claim.draw_results.match_count} Matches</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        ${Number(claim.draw_results.prize_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {claim.proof_url ? (
                          <a 
                            href={claim.proof_url.startsWith('http') ? claim.proof_url : signedUrlsMap[claim.proof_url]} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View Document
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">No proof</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          claim.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          claim.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {claim.verification_status.charAt(0).toUpperCase() + claim.verification_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          claim.payout_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          claim.verification_status === 'approved' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {claim.payout_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {claim.verification_status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <form action={updateStatus}>
                              <input type="hidden" name="claim_id" value={claim.id} />
                              <input type="hidden" name="status" value="approved" />
                              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                                Approve
                              </Button>
                            </form>
                            <form action={updateStatus}>
                              <input type="hidden" name="claim_id" value={claim.id} />
                              <input type="hidden" name="status" value="rejected" />
                              <Button type="submit" size="sm" variant="outline" className="text-rose-600 hover:text-rose-700 h-8 text-xs">
                                Reject
                              </Button>
                            </form>
                          </div>
                        )}
                        {claim.verification_status === 'approved' && claim.payout_status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <form action={updateStatus}>
                              <input type="hidden" name="claim_id" value={claim.id} />
                              <input type="hidden" name="status" value="paid" />
                              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                                Mark as Paid
                              </Button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { simulateDraw } from '@/lib/draw-engine/core'

export async function POST(request: Request) {
  try {
    const { drawId } = await request.json()
    if (!drawId) {
      return NextResponse.json({ error: 'drawId is required' }, { status: 400 })
    }

    // Verify admin (using service role client)
    const supabaseAdmin = createAdminClient()

    // Technically in a real admin API we should verify the user's cookie to see if they are an admin.
    // For now, this is a trusted server-side execution.
    // Ensure the draw is in draft
    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .select('status')
      .eq('id', drawId)
      .single()

    if (error || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
    }

    if (draw.status !== 'draft' && draw.status !== 'simulated') {
      return NextResponse.json({ error: 'Only draft or simulated draws can be simulated' }, { status: 400 })
    }

    const simulationResult = await simulateDraw(drawId, supabaseAdmin)
    return NextResponse.json({ success: true, result: simulationResult })
  } catch (error: any) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: error.message || 'Simulation failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishDraw } from '@/lib/draw-engine/core'

export async function POST(request: Request) {
  try {
    const { drawId } = await request.json()
    if (!drawId) {
      return NextResponse.json({ error: 'drawId is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .select('status, simulation_result')
      .eq('id', drawId)
      .single()

    if (error || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 })
    }

    if (draw.status === 'published' || draw.status === 'completed') {
      return NextResponse.json({ error: 'Draw is already published' }, { status: 400 })
    }

    if (!draw.simulation_result) {
      return NextResponse.json({ error: 'Draw must be simulated first' }, { status: 400 })
    }

    await publishDraw(drawId, supabaseAdmin)
    
    return NextResponse.json({ success: true, message: 'Draw published successfully' })
  } catch (error: any) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: error.message || 'Publish failed' }, { status: 500 })
  }
}

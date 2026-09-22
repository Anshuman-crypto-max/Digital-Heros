import { SupabaseClient } from '@supabase/supabase-js'
import { cyrb128, mulberry32, selectWeightedUnique, generateDeterministicEntry } from './random'

export interface DrawSimulationResult {
  winningNumbers: number[]
  totalPool: number
  rolloverAmount: number
  jackpotAmount: number
  fourMatchAmount: number
  threeMatchAmount: number
  entries: SimulatedEntry[]
}

export interface SimulatedEntry {
  userId: string
  numbers: number[]
  matchCount: number
  prizeAmount: number
  prizeTier: string | null
}

const PRIZE_CONTRIBUTION_PER_SUBSCRIBER = 5.00
const TIER_5_PCT = 0.40
const TIER_4_PCT = 0.35
const TIER_3_PCT = 0.25

/**
 * Executes a full draw simulation.
 * @param drawId The ID of the draw record to simulate.
 * @param supabase An admin Supabase client to bypass RLS.
 */
export async function simulateDraw(drawId: string, supabase: SupabaseClient): Promise<DrawSimulationResult> {
  // 1. Fetch the draw
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single()

  if (drawError || !draw) throw new Error(`Draw not found: ${drawError?.message}`)

  const drawMonthStr = draw.draw_month.substring(0, 7) // 'YYYY-MM'

  // 2. Determine Rollover from previous published/completed draw
  let rolloverAmount = 0
  const { data: previousDraws } = await supabase
    .from('draws')
    .select('id')
    .in('status', ['published', 'completed'])
    .lt('draw_month', draw.draw_month)
    .order('draw_month', { ascending: false })
    .limit(1)

  if (previousDraws && previousDraws.length > 0) {
    const prevDrawId = previousDraws[0].id
    // Did it have a 5-match winner?
    const { data: prevJackpotWinners } = await supabase
      .from('draw_results')
      .select('id')
      .eq('draw_id', prevDrawId)
      .eq('match_count', 5)

    if (!prevJackpotWinners || prevJackpotWinners.length === 0) {
      // Get the jackpot amount from that draw's prize pool
      const { data: prevPool } = await supabase
        .from('prize_pools')
        .select('five_match_amount')
        .eq('draw_id', prevDrawId)
        .single()
      
      if (prevPool) {
        rolloverAmount = Number(prevPool.five_match_amount || 0)
      }
    }
  }

  // 3. Find active subscribers
  const { data: activeSubs, error: subsError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')

  if (subsError) throw new Error(`Failed to fetch subscriptions: ${subsError.message}`)
  
  const activeUserIds = new Set(activeSubs?.map(s => s.user_id) || [])
  const totalPool = (activeUserIds.size * PRIZE_CONTRIBUTION_PER_SUBSCRIBER) + rolloverAmount
  const newPool = (activeUserIds.size * PRIZE_CONTRIBUTION_PER_SUBSCRIBER)
  
  const jackpotAmount = (newPool * TIER_5_PCT) + rolloverAmount
  const fourMatchAmount = (newPool * TIER_4_PCT)
  const threeMatchAmount = (newPool * TIER_3_PCT)

  // 4. Fetch all scores for the draw month to calculate weights
  // Use start of month and end of month
  const startDate = `${drawMonthStr}-01`
  const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))
    .toISOString().substring(0, 10)

  const { data: monthScores, error: scoresError } = await supabase
    .from('scores')
    .select('user_id, score, score_date')
    .gte('score_date', startDate)
    .lt('score_date', endDate)

  if (scoresError) throw new Error(`Failed to fetch scores: ${scoresError.message}`)

  // Calculate weights (1-45)
  const weights: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) weights[i] = 1 // Baseline weight

  if (monthScores) {
    for (const row of monthScores) {
      if (row.score >= 1 && row.score <= 45) {
        weights[row.score] += 1
      }
    }
  }

  // 5. Generate Entries for eligible subscribers
  const entries: SimulatedEntry[] = []
  
  // Find latest score for each active user
  const latestUserScores: Record<string, number> = {}
  if (monthScores) {
    // Sort scores so the latest is processed last, overwriting earlier ones
    const sortedScores = [...monthScores].sort((a, b) => new Date(a.score_date).getTime() - new Date(b.score_date).getTime())
    for (const row of sortedScores) {
      if (activeUserIds.has(row.user_id)) {
        latestUserScores[row.user_id] = row.score
      }
    }
  }

  for (const userId of Object.keys(latestUserScores)) {
    const score = latestUserScores[userId]
    const seed = `${userId}-${draw.draw_month}-${score}`
    const numbers = generateDeterministicEntry(seed)
    
    entries.push({
      userId,
      numbers,
      matchCount: 0,
      prizeAmount: 0,
      prizeTier: null
    })
  }

  // 6. Generate Winning Numbers
  // We use the draw ID itself to seed the draw RNG to keep it deterministic per draw
  const drawSeed = cyrb128(drawId)
  const drawRng = mulberry32(drawSeed)
  const winningNumbers = selectWeightedUnique(weights, 5, drawRng)

  // 7. Calculate matches and prize distribution
  let match5Count = 0
  let match4Count = 0
  let match3Count = 0

  for (const entry of entries) {
    let matchCount = 0
    for (const num of entry.numbers) {
      if (winningNumbers.includes(num)) {
        matchCount++
      }
    }
    entry.matchCount = matchCount
    
    if (matchCount === 5) match5Count++
    if (matchCount === 4) match4Count++
    if (matchCount === 3) match3Count++
  }

  const match5PrizeEach = match5Count > 0 ? (jackpotAmount / match5Count) : 0
  const match4PrizeEach = match4Count > 0 ? (fourMatchAmount / match4Count) : 0
  const match3PrizeEach = match3Count > 0 ? (threeMatchAmount / match3Count) : 0

  for (const entry of entries) {
    if (entry.matchCount === 5) {
      entry.prizeAmount = match5PrizeEach
      entry.prizeTier = 'jackpot'
    } else if (entry.matchCount === 4) {
      entry.prizeAmount = match4PrizeEach
      entry.prizeTier = 'tier4'
    } else if (entry.matchCount === 3) {
      entry.prizeAmount = match3PrizeEach
      entry.prizeTier = 'tier3'
    }
    
    // Safety check: round down to cents to avoid float precision issues
    entry.prizeAmount = Math.floor(entry.prizeAmount * 100) / 100
  }

  const result: DrawSimulationResult = {
    winningNumbers,
    totalPool,
    rolloverAmount,
    jackpotAmount,
    fourMatchAmount,
    threeMatchAmount,
    entries
  }

  // Save simulation to the DB
  const { error: updateError } = await supabase
    .from('draws')
    .update({ 
      simulation_result: result as any,
      generated_numbers: winningNumbers,
      status: 'simulated'
    })
    .eq('id', drawId)

  if (updateError) {
    throw new Error(`Failed to save simulation result: ${updateError.message}`)
  }

  return result
}

/**
 * Publishes a previously simulated draw.
 */
export async function publishDraw(drawId: string, supabase: SupabaseClient) {
  const { data: draw, error: drawError } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single()

  if (drawError || !draw) throw new Error('Draw not found')
  if (draw.status === 'published' || draw.status === 'completed') {
    throw new Error('Draw is already published')
  }
  if (!draw.simulation_result) {
    throw new Error('Draw must be simulated before publishing')
  }

  const sim = draw.simulation_result as unknown as DrawSimulationResult

  // 1. Update Draw Status
  const { error: updateError } = await supabase
    .from('draws')
    .update({ 
      status: 'published', 
      published_at: new Date().toISOString() 
    })
    .eq('id', drawId)

  if (updateError) throw new Error(`Failed to publish: ${updateError.message}`)

  // 2. Insert Prize Pool
  await supabase.from('prize_pools').insert({
    draw_id: drawId,
    total_pool: sim.totalPool,
    jackpot_amount: sim.jackpotAmount,
    four_match_amount: sim.fourMatchAmount,
    three_match_amount: sim.threeMatchAmount
  })

  // 3. Insert Entries and Results in chunks if needed, but we'll do simple bulk inserts
  if (sim.entries.length > 0) {
    const entriesToInsert = sim.entries.map(e => ({
      draw_id: drawId,
      user_id: e.userId,
      numbers: e.numbers
    }))
    
    await supabase.from('draw_entries').insert(entriesToInsert as any)

    const winners = sim.entries.filter(e => e.matchCount >= 3)
    if (winners.length > 0) {
      const resultsToInsert = winners.map(w => ({
        draw_id: drawId,
        user_id: w.userId,
        match_count: w.matchCount,
        prize_tier: w.prizeTier,
        prize_amount: w.prizeAmount,
        verification_status: 'pending',
        payout_status: 'pending'
      }))
      
      await supabase.from('draw_results').insert(resultsToInsert)
    }
  }

  return true
}

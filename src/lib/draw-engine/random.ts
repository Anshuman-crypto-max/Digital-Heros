// A simple deterministic PRNG (Mulberry32)
// See: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Simple hash function for string -> number seed
export function cyrb128(str: string): number {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  h1 ^= h2 ^ h3 ^ h4
  return h1 >>> 0
}

/**
 * Generates 5 unique numbers between 1 and 45.
 * Uses a seed string to ensure deterministic generation for the same seed.
 */
export function generateDeterministicEntry(seedStr: string): number[] {
  const seed = cyrb128(seedStr)
  const rng = mulberry32(seed)
  const numbers: Set<number> = new Set()

  while (numbers.size < 5) {
    const num = Math.floor(rng() * 45) + 1
    numbers.add(num)
  }

  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * Weighted random selection of N unique items without replacement.
 * Weights map: item -> weight.
 */
export function selectWeightedUnique(
  weights: Record<number, number>,
  count: number,
  rng: () => number
): number[] {
  // Clone weights so we can modify them (without replacement logic)
  const availableWeights = { ...weights }
  const selected: number[] = []

  for (let i = 0; i < count; i++) {
    const keys = Object.keys(availableWeights).map(Number)
    if (keys.length === 0) break

    let totalWeight = 0
    for (const key of keys) {
      totalWeight += availableWeights[key]
    }

    let r = rng() * totalWeight
    let chosen = keys[0]

    for (const key of keys) {
      r -= availableWeights[key]
      if (r <= 0) {
        chosen = key
        break
      }
    }

    selected.push(chosen)
    // Remove the chosen number from available pool to avoid duplicates
    delete availableWeights[chosen]
  }

  return selected.sort((a, b) => a - b)
}

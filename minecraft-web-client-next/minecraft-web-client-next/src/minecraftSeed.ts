/**
 * Map create-world seed input to flying-squid `generation.options.seed` (numeric).
 * Empty → undefined (server chooses a random seed).
 * Integer strings → number, wrapping to 32-bit signed when out of range.
 * Other text → Java-style String.hashCode (not identical to all Java Edition versions for text seeds).
 */
export function userSeedToFlyingSquidNumber (raw: string): number | undefined {
  const s = raw.trim()
  if (!s) return undefined

  if (/^-?\d+$/.test(s)) {
    const bi = BigInt(s)
    const min32 = BigInt(-0x80000000)
    const max32 = BigInt(0x7fffffff)
    if (bi >= min32 && bi <= max32) {
      return Number(bi)
    }
    return Number(BigInt.asIntN(32, bi))
  }

  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

/**
 * Content deduplication using simhash (64-bit fingerprinting).
 * Uses FNV-1a per-token hashing to build a simhash fingerprint.
 */

/** Tokenize text into lowercase words */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** FNV-1a hash returning a 64-bit bigint */
function fnv1a(str: string): bigint {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash;
}

/** Compute a 64-bit simhash from text */
export function computeSimhash(text: string): bigint {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0n;

  const v = new Array<number>(64).fill(0);

  for (const token of tokens) {
    const hash = fnv1a(token);
    for (let i = 0; i < 64; i++) {
      if ((hash >> BigInt(i)) & 1n) {
        v[i]++;
      } else {
        v[i]--;
      }
    }
  }

  let fingerprint = 0n;
  for (let i = 0; i < 64; i++) {
    if (v[i] > 0) {
      fingerprint |= 1n << BigInt(i);
    }
  }
  return fingerprint;
}

/** Count differing bits between two 64-bit hashes */
export function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b;
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

/** Check if two simhashes are similar within a threshold (default: 3 bits) */
export function areSimilar(hash1: bigint, hash2: bigint, threshold = 3): boolean {
  return hammingDistance(hash1, hash2) <= threshold;
}

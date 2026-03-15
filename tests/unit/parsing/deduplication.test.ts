import { describe, it, expect } from 'vitest';
import {
  tokenize,
  computeSimhash,
  hammingDistance,
  areSimilar,
} from '../../../src/parsing/deduplication';

describe('tokenize', () => {
  it('splits text into lowercase words', () => {
    expect(tokenize('Hello World')).toEqual(['hello', 'world']);
  });

  it('removes punctuation', () => {
    expect(tokenize('Hello, World!')).toEqual(['hello', 'world']);
  });

  it('filters empty tokens', () => {
    expect(tokenize('  hello   world  ')).toEqual(['hello', 'world']);
  });

  it('returns empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('computeSimhash', () => {
  it('returns 0n for empty text', () => {
    expect(computeSimhash('')).toBe(0n);
  });

  it('returns consistent hash for same content', () => {
    const hash1 = computeSimhash('hello world foo bar');
    const hash2 = computeSimhash('hello world foo bar');
    expect(hash1).toBe(hash2);
  });

  it('returns different hashes for different content', () => {
    const hash1 = computeSimhash('the quick brown fox jumps over the lazy dog');
    const hash2 = computeSimhash('completely different content about programming');
    expect(hash1).not.toBe(hash2);
  });

  it('returns similar hashes for similar content', () => {
    const hash1 = computeSimhash('the quick brown fox jumps over the lazy dog');
    const hash2 = computeSimhash('the quick brown fox leaps over the lazy dog');
    const distance = hammingDistance(hash1, hash2);
    expect(distance).toBeLessThan(10);
  });
});

describe('hammingDistance', () => {
  it('returns 0 for identical hashes', () => {
    expect(hammingDistance(0b1010n, 0b1010n)).toBe(0);
  });

  it('counts differing bits', () => {
    expect(hammingDistance(0b1010n, 0b1001n)).toBe(2);
  });

  it('handles zero', () => {
    expect(hammingDistance(0n, 0n)).toBe(0);
  });
});

describe('areSimilar', () => {
  it('returns true for identical hashes', () => {
    expect(areSimilar(42n, 42n)).toBe(true);
  });

  it('returns true within threshold', () => {
    expect(areSimilar(0b1010n, 0b1011n, 3)).toBe(true);
  });

  it('returns false beyond threshold', () => {
    expect(areSimilar(0b0000n, 0b1111n, 2)).toBe(false);
  });

  it('uses default threshold of 3', () => {
    expect(areSimilar(0b1010n, 0b1011n)).toBe(true);
    expect(areSimilar(0b0000n, 0b11111n)).toBe(false);
  });
});

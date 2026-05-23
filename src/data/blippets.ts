import type { BlippetSpecies } from '../types/blippet';
import { SPECIES } from './blippets.generated';

export { SPECIES };

const BY_SLUG = new Map(SPECIES.map(s => [s.slug, s]));
const BY_DEX = new Map(SPECIES.map(s => [s.dex, s]));

export function getSpecies(slug: string): BlippetSpecies {
  const s = BY_SLUG.get(slug);
  if (!s) throw new Error(`Unknown blippet slug: ${slug}`);
  return s;
}

export function getSpeciesByDex(dex: number): BlippetSpecies | undefined {
  return BY_DEX.get(dex);
}

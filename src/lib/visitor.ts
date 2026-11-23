// Visitor state: kept in the browser only, with no accounts and no server
// (docs/PLAN.md → Architecture). The village and pixel house read the same keys.
// The characters themselves are listed in ./characters.ts.
import { VISITORS, type CharacterId } from './characters';

const KEYS = { character: 'kg:character', fallSeen: 'kg:fall-seen' } as const;

// Storage can throw (private mode, blocked site data), so every access is guarded
// and the site works without it: the visitor just sees the fall again.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* not persisted; fine */
  }
}

export function getCharacter(): CharacterId | null {
  const id = read(KEYS.character);
  return VISITORS.some((c) => c.id === id) ? (id as CharacterId) : null;
}

export const setCharacter = (id: CharacterId) => write(KEYS.character, id);

/** True once the visitor has reached the ground, by falling or by skipping. */
export const hasSeenFall = () => read(KEYS.fallSeen) === '1';

export const markFallSeen = () => write(KEYS.fallSeen, '1');

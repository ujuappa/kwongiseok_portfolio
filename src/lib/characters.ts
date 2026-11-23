// The characters: the one list the fall, the village, and the pixel house read.
//
// To add a character: put its sheets in characters/<id>/source/, run
// `python scripts/characters/process.py`, and add one entry to ENTRIES.
// The script measures the art into character-art.json; anything a character
// is missing comes back as null here, and the scenes fall back to placeholder
// shapes for it (see characters/character-assets-handoff.md).
import art from './character-art.json';

interface Entry {
  id: string;
  /** Shown in the character select. */
  name: string;
  /** Alt text for the portrait. */
  description: string;
  /** Visitors can be picked. The host (the site owner) greets them; not designed yet. */
  role: 'visitor' | 'host';
  /** Colour of the placeholder figure, used for any art that is missing. */
  color: string;
}

const ENTRIES = [
  {
    id: 'visitor-01',
    name: 'Red sunglasses',
    description: 'A woman with long silver hair fading to coral red, red sunglasses pushed up on her head.',
    role: 'visitor',
    color: '#e05a5a',
  },
  {
    id: 'visitor-02',
    name: 'Green scarf',
    description: 'A man with messy black hair, a dark green scarf, and a long brown coat.',
    role: 'visitor',
    color: '#4d6b3c',
  },
  // The host goes here once designed, with role: 'host'.
] as const satisfies readonly Entry[];

export type CharacterId = (typeof ENTRIES)[number]['id'];

/** An image, sized in its own pixels. */
export interface Art {
  src: string;
  w: number;
  h: number;
}
/** A fall pose. `head` is the face centre within the image: the point the fall holds still. */
export interface Pose extends Art {
  head: [number, number];
}
export interface Fall {
  freefall: Pose;
  /** `straps`: centre x and width of each strap on the top edge, where the canopy lines attach. */
  parachute: Pose & { straps: [number, number][] };
  landing: Pose;
}
/** Village sprite sheet: rows down, left, up; columns stand, step A, stand, step B. */
export interface Walk {
  src: string;
  rows: number;
  cols: number;
  cell: [number, number];
  /** Where the feet touch the ground, within a cell. */
  anchor: [number, number];
  fps: number;
}

export interface Character extends Entry {
  id: CharacterId;
  /** Null until drawn. A temporary portrait (cropped from the turnaround) still counts. */
  portrait: (Art & { temporary: boolean }) | null;
  fall: Fall | null;
  walk: Walk | null;
}

type Measured = {
  portrait?: Character['portrait'];
  fall?: Fall & { face: number };
  walk?: Walk;
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const at = <T extends { src: string }>(a: T): T => ({ ...a, src: `${base}/${a.src}` });

function resolve(entry: (typeof ENTRIES)[number]): Character {
  const m = (art as unknown as Record<string, Measured>)[entry.id] ?? {};
  return {
    ...entry,
    portrait: m.portrait ? at(m.portrait) : null,
    fall: m.fall
      ? {
          freefall: at(m.fall.freefall),
          parachute: at(m.fall.parachute),
          landing: at(m.fall.landing),
        }
      : null,
    walk: m.walk ? at(m.walk) : null,
  };
}

export const CHARACTERS: Character[] = ENTRIES.map(resolve);

/** The characters a visitor can pick. */
export const VISITORS = CHARACTERS.filter((c) => c.role === 'visitor');

export const getCharacterById = (id: string) => CHARACTERS.find((c) => c.id === id);

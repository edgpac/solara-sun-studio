export interface Level {
  id: number;
  name: string;
  region: string;
  vibe: string;
  moves: number;
  /** Score thresholds: [1 star, 2 stars, 3 stars] */
  stars: [number, number, number];
}

export const LEVELS: Level[] = [
  { id: 1,  name: "Cabo Sunrise",       region: "Cabo San Lucas",   vibe: "First light over the arch",   moves: 24, stars: [1200,  2200,  3500]  },
  { id: 2,  name: "Talavera Workshop",  region: "Puebla",           vibe: "Hand-glazed in cobalt",       moves: 24, stars: [1500,  2800,  4400]  },
  { id: 3,  name: "Marigold Plaza",     region: "Oaxaca",           vibe: "Cempasúchil season",          moves: 22, stars: [1800,  3200,  5200]  },
  { id: 4,  name: "Jade Cenote",        region: "Yucatán",          vibe: "Still waters, ancient eyes",  moves: 22, stars: [2100,  3800,  6000]  },
  { id: 5,  name: "Copper Sierra",      region: "Chihuahua",        vibe: "Canyon-forged",               moves: 20, stars: [2500,  4400,  7000]  },
  { id: 6,  name: "Purple Twilight",    region: "San Miguel",       vibe: "Bougainvillea at dusk",       moves: 20, stars: [3000,  5200,  8000]  },
  { id: 7,  name: "Hacienda Courtyard", region: "Mérida",           vibe: "Limestone and shade",         moves: 18, stars: [3500,  6000,  9200]  },
  { id: 8,  name: "Pacific Cliffs",     region: "Todos Santos",     vibe: "Salt spray, gold horizon",    moves: 18, stars: [4000,  7000,  10500] },
  { id: 9,  name: "Aztec Ruins",        region: "Teotihuacán",      vibe: "Sun of the fifth age",        moves: 16, stars: [4800,  8200,  12000] },
  { id: 10, name: "Obsidian Eclipse",   region: "Volcán Paricutín", vibe: "Where the suns awaken",       moves: 16, stars: [5500,  9500,  14000] },
];

// Name/region/vibe pools for procedurally generated levels beyond 10.
const NAMES = [
  "Desert Bloom", "Coastal Haze", "Mountain Fire", "River Gold",
  "Valley Sun", "Peak Eclipse", "Deep Sky", "Ancient Light",
  "Crimson Dawn", "Silver Dusk", "Ember Night", "Crystal Noon",
  "Obsidian Shore", "Jade Horizon", "Copper Sky", "Golden Reef",
  "Midnight Arch", "Solar Storm", "Amber Tide", "Blazing Mesa",
];

const REGIONS = [
  "Baja California", "Sonora", "Jalisco", "Michoacán",
  "Guerrero", "Colima", "Nayarit", "Sinaloa",
  "Durango", "Zacatecas", "Guanajuato", "Querétaro",
  "Veracruz", "Tabasco", "Chiapas", "Campeche",
  "Tlaxcala", "Morelos", "Hidalgo", "Aguascalientes",
];

const VIBES = [
  "Heat rising from the sierra",
  "Tide pools at golden hour",
  "Cactus blooms after rain",
  "Volcanoes kissed by cloud",
  "The market at midnight",
  "Cenotes in summer haze",
  "Sea glass on black sand",
  "Fireflies in the milpa",
  "Bells over the barranca",
  "Smoke from copal braziers",
  "Salt flats under full moon",
  "Arch in the morning fog",
];

function round100(n: number): number {
  return Math.round(n / 100) * 100;
}

/** Procedurally generates a level for any id beyond the hand-crafted 10. */
function generateLevel(id: number): Level {
  const beyond = id - 10;
  // Moves: hold at 16 for levels 11-15, drop by 1 every 5 levels, floor at 12.
  const moves = Math.max(12, 16 - Math.floor(beyond / 5));
  // Score target: compound 10% growth per level past 10.
  const target3 = round100(14000 * Math.pow(1.1, beyond));

  return {
    id,
    name: NAMES[(id - 11) % NAMES.length],
    region: REGIONS[(id - 11) % REGIONS.length],
    vibe: VIBES[(id - 11) % VIBES.length],
    moves,
    stars: [round100(target3 * 0.35), round100(target3 * 0.6), target3],
  };
}

/** Returns a level for any positive id — never returns undefined. */
export function getLevel(id: number): Level {
  return LEVELS.find((l) => l.id === id) ?? generateLevel(id);
}

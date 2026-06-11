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
  { id: 1,  name: "Cabo Sunrise",       region: "Cabo San Lucas",  vibe: "First light over the arch", moves: 24, stars: [1200, 2200, 3500] },
  { id: 2,  name: "Talavera Workshop",  region: "Puebla",          vibe: "Hand-glazed in cobalt",     moves: 24, stars: [1500, 2800, 4400] },
  { id: 3,  name: "Marigold Plaza",     region: "Oaxaca",          vibe: "Cempasúchil season",        moves: 22, stars: [1800, 3200, 5200] },
  { id: 4,  name: "Jade Cenote",        region: "Yucatán",         vibe: "Still waters, ancient eyes", moves: 22, stars: [2100, 3800, 6000] },
  { id: 5,  name: "Copper Sierra",      region: "Chihuahua",       vibe: "Canyon-forged",             moves: 20, stars: [2500, 4400, 7000] },
  { id: 6,  name: "Purple Twilight",    region: "San Miguel",      vibe: "Bougainvillea at dusk",     moves: 20, stars: [3000, 5200, 8000] },
  { id: 7,  name: "Hacienda Courtyard", region: "Mérida",          vibe: "Limestone and shade",       moves: 18, stars: [3500, 6000, 9200] },
  { id: 8,  name: "Pacific Cliffs",     region: "Todos Santos",    vibe: "Salt spray, gold horizon",  moves: 18, stars: [4000, 7000, 10500] },
  { id: 9,  name: "Aztec Ruins",        region: "Teotihuacán",     vibe: "Sun of the fifth age",      moves: 16, stars: [4800, 8200, 12000] },
  { id: 10, name: "Obsidian Eclipse",   region: "Volcán Paricutín", vibe: "Where the suns awaken",    moves: 16, stars: [5500, 9500, 14000] },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

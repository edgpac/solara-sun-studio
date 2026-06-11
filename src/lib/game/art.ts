import goldenSun from "@/assets/sun-golden.png";
import oceanSun from "@/assets/sun-ocean.png";
import jadeSun from "@/assets/sun-jade.png";
import moonSun from "@/assets/sun-moon.png";
import copperSun from "@/assets/sun-copper.png";
import obsidianSun from "@/assets/sun-obsidian.png";

export const SUN_IMAGES = [goldenSun, oceanSun, jadeSun, moonSun, copperSun, obsidianSun] as const;

export const SUN_NAMES = [
  "Golden Talavera",
  "Ocean Sun",
  "Jade Sun",
  "Purple Moon",
  "Copper Desert",
  "Obsidian Eclipse",
] as const;

/** Halo + ray + glow color per piece, in oklch. */
export const SUN_AURA = [
  "oklch(0.85 0.20 80)",   // gold
  "oklch(0.62 0.18 220)",  // talavera blue
  "oklch(0.62 0.16 150)",  // jade
  "oklch(0.55 0.18 295)",  // purple
  "oklch(0.62 0.18 45)",   // copper
  "oklch(0.55 0.22 25)",   // obsidian ember
] as const;

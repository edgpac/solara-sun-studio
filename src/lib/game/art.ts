import goldenSun from "@/assets/sun-golden.png";
import oceanSun from "@/assets/sun-ocean.png";
import jadeSun from "@/assets/sun-jade.png";
import moonSun from "@/assets/sun-moon.png";
import copperSun from "@/assets/sun-copper.png";
import obsidianSun from "@/assets/sun-obsidian.png";

export const SUN_IMAGES = [goldenSun, oceanSun, jadeSun, moonSun, copperSun, obsidianSun] as const;

export const SUN_NAMES = [
  "Sol Dorado",
  "Ola Marina",
  "Jade Guerrero",
  "Luna Dorada",
  "Mascara Dorada",
  "El Magnifico",
] as const;

/** Halo + ray + glow color per piece, in oklch. */
export const SUN_AURA = [
  "oklch(0.82 0.22 72)",   // rich gold
  "oklch(0.60 0.18 205)",  // teal ocean
  "oklch(0.62 0.16 150)",  // jade green
  "oklch(0.75 0.18 72)",   // warm gold/moon
  "oklch(0.78 0.20 65)",   // amber gold
  "oklch(0.68 0.18 130)",  // gold-green ornate
] as const;

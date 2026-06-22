// ── SERVICE LAYER: condition + time → visual scene ──

import { bucketFor, type ConditionBucket } from "../data/weatherCodes";

export type Particle = "none" | "rain" | "snow";

export interface Scene {
  gradient: [string, string, string];
  particle: Particle;
  accent: string;
  /** card surface tint (rgba) */
  surface: string;
}

const DAY: Record<ConditionBucket, Scene> = {
  clear: { gradient: ["#2b6df6", "#4f9bf3", "#9ecbf5"], particle: "none", accent: "#ffd65a", surface: "rgba(255,255,255,0.16)" },
  cloudy: { gradient: ["#5b7393", "#7e93ad", "#a9b8c8"], particle: "none", accent: "#e6edf5", surface: "rgba(255,255,255,0.14)" },
  fog: { gradient: ["#7b8794", "#9aa3ad", "#c2c8ce"], particle: "none", accent: "#eef1f4", surface: "rgba(255,255,255,0.14)" },
  rain: { gradient: ["#39495c", "#566678", "#76879a"], particle: "rain", accent: "#9fd0ff", surface: "rgba(255,255,255,0.12)" },
  snow: { gradient: ["#6b86a6", "#92a8c2", "#c3d4e6"], particle: "snow", accent: "#ffffff", surface: "rgba(255,255,255,0.18)" },
  thunder: { gradient: ["#2b3242", "#454b5e", "#6a6f82"], particle: "rain", accent: "#ffe27a", surface: "rgba(255,255,255,0.10)" },
};

const NIGHT: Record<ConditionBucket, Scene> = {
  clear: { gradient: ["#0b1338", "#1b2a5b", "#33407a"], particle: "none", accent: "#cfd8ff", surface: "rgba(255,255,255,0.10)" },
  cloudy: { gradient: ["#1a2233", "#2b3548", "#414c63"], particle: "none", accent: "#c5cede", surface: "rgba(255,255,255,0.10)" },
  fog: { gradient: ["#222831", "#363f4a", "#525c68"], particle: "none", accent: "#dde2e8", surface: "rgba(255,255,255,0.10)" },
  rain: { gradient: ["#141b27", "#28323f", "#3c4a5a"], particle: "rain", accent: "#8fc1ff", surface: "rgba(255,255,255,0.08)" },
  snow: { gradient: ["#1c2737", "#34465c", "#56708d"], particle: "snow", accent: "#ffffff", surface: "rgba(255,255,255,0.12)" },
  thunder: { gradient: ["#0e1118", "#22283a", "#3a4054"], particle: "rain", accent: "#ffe27a", surface: "rgba(255,255,255,0.08)" },
};

export function sceneFor(weatherCode: number, isDay: boolean): Scene {
  const bucket = bucketFor(weatherCode);
  return (isDay ? DAY : NIGHT)[bucket];
}

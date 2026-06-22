// Design tokens approximating the iOS Weather visual system.

export const theme = {
  radius: { sheet: 28, card: 22, pill: 16 },
  space: (n: number) => `${n * 4}px`,
  font: {
    family: '"Inter", -apple-system, "SF Pro Display", system-ui, sans-serif',
    hero: 96,
    h1: 30,
    h2: 22,
    body: 17,
    caption: 13,
  },
  weight: { thin: 200, regular: 400, medium: 500, semibold: 600 },
} as const;

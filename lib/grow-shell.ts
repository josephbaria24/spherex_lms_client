/**
 * Grow Shell — SphereX student UI design system
 *
 * Warm cream canvas, bento cards, coral serif accents, pill controls.
 * Invoke in chat: "Use Grow Shell" or "Apply Grow Shell design"
 *
 * @see components/grow-shell
 * @see .cursor/rules/grow-shell.mdc
 */

export const GROW_SHELL = {
  /** Official design system name */
  name: "Grow Shell",
  /** Short label for UI copy */
  tagline: "today you grow",

  colors: {
    canvas: "#ffffff",
    ink: "#1c1917",
    muted: "#6b5c4f",
    border: "#ebe4da",
    borderSoft: "#ddd6ce",
    accent: "#e85d4a",
    navy: "#1a1f2e",
    violet: "#7c6cf0",
    lime: "#dcf7a1",
    lilac: "#ebe4f8",
  },

  radius: {
    shell: "1.5rem",
    card: "1.75rem",
    control: "9999px",
  },
} as const

/** Tailwind utility class names — use these when building Grow Shell pages */
export const grow = {
  shell: "grow-shell",
  bento: "grow-bento",
  card: "grow-card",
  cardMuted: "grow-card-muted",
  cardAccent: "grow-card-accent",
  cardLime: "grow-card-lime",
  cardDark: "grow-card-dark",
  cardCoral: "grow-card-coral",
  tabsList: "grow-tabs-list",
  tabTrigger: "grow-tab-trigger",
  toolbar: "grow-toolbar",
  input: "grow-input",
  btnOutline: "grow-btn-outline",
  btnPrimary: "grow-btn-primary",
  empty: "grow-empty",
  badge: "grow-badge",
} as const

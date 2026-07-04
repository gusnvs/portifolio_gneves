/**
 * Configuração das seções da home "snowmania".
 * Alturas em vh — a soma define o comprimento total do scroll virtual.
 */
export const SECTION_VH = {
  intro: 280,
  fall: 200,
  bio: 200,
  night: 130,
} as const;

export const TOTAL_VH =
  SECTION_VH.intro + SECTION_VH.fall + SECTION_VH.bio + SECTION_VH.night;

/** Altura rolável em vh (o último viewport não rola). */
export const SCROLL_VH = TOTAL_VH - 100;

/** Início de cada seção, em vh rolados. */
export const SECTION_START_VH = {
  intro: 0,
  fall: SECTION_VH.intro,
  bio: SECTION_VH.intro + SECTION_VH.fall,
  night: SECTION_VH.intro + SECTION_VH.fall + SECTION_VH.bio,
} as const;

/** Paradas da cor de fundo: [vh rolados, cor]. Interpolação linear entre elas. */
export const BG_STOPS: [number, string][] = [
  [0, "#f5eddb"],
  [170, "#f5eddb"],
  [270, "#ffb27d"],
  [430, "#ffb27d"],
  [530, "#ff6a1a"],
  [610, "#ff6a1a"],
  [700, "#0e0c10"],
];

/** Cor do texto/UI muda quando a página escurece. */
export const INK_DARK = "#161310";
export const INK_LIGHT = "#f4ece0";
export const NIGHT_INK_SWITCH_VH = 655;

/**
 * Configuração das seções da home "snowmania".
 * Alturas em vh — a soma define o comprimento total do scroll virtual.
 */
export const SECTION_VH = {
  // curta: a divisa da próxima seção entra assim que o título encosta no topo
  intro: 150,
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

/** Fundo fixo (só a intro mostra ele — as seções trazem seus planos). */
export const BASE_BG = "#f5eddb";

/**
 * Cor do plano de cada seção — sobe cobrindo a anterior com a borda
 * inclinada, como no site de referência.
 */
export const SECTION_PLANE_COLORS = {
  fall: "#ffb27d",
  bio: "#ff6a1a",
  night: "#0e0c10",
} as const;

/** Cor do texto/UI muda quando a página escurece. */
export const INK_DARK = "#161310";
export const INK_LIGHT = "#f4ece0";
export const NIGHT_INK_SWITCH_VH = SECTION_START_VH.night - 25;

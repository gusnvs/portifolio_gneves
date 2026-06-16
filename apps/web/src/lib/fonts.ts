import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

/** Display — characterful contemporary grotesque for big hero type. */
export const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/** Body — refined grotesque for readable copy. */
export const fontBody = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

/** Mono — authentic terminal/code voice. Used heavily across the system. */
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontClassNames = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;

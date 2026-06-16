import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontClassNames } from "@/lib/fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://gustavoneves.dev"),
  title: {
    default: "Gustavo Neves — Desenvolvedor & Tecnólogo Criativo",
    template: "%s · Gustavo Neves",
  },
  description:
    "Portfólio do Gustavo Neves — desenvolvedor full-stack & tecnólogo criativo. Um site que inicia como um terminal e se transforma num desktop retrô.",
  keywords: [
    "Gustavo Neves",
    "developer",
    "portfolio",
    "creative technologist",
    "full-stack",
    "three.js",
    "interactive",
  ],
  authors: [{ name: "Gustavo Neves" }],
  openGraph: {
    type: "website",
    title: "Gustavo Neves — Desenvolvedor & Tecnólogo Criativo",
    description:
      "Um portfólio de desenvolvedor que inicia como um terminal e se transforma num desktop retrô.",
    siteName: "Gustavo Neves",
    images: [{ url: "/mascote.png", width: 1024, height: 1024, alt: "Gustavo Neves mascot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gustavo Neves — Desenvolvedor & Tecnólogo Criativo",
    description:
      "Um portfólio de desenvolvedor que inicia como um terminal e se transforma num desktop retrô.",
    images: ["/mascote.png"],
  },
  icons: {
    icon: [{ url: "/mascote.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontClassNames} h-full`}>
      <body className="grain min-h-full antialiased">{children}</body>
    </html>
  );
}

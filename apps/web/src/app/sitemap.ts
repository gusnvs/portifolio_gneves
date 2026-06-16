import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://gustavoneves.dev";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/system`, lastModified: now, priority: 0.7 },
    { url: `${base}/system/desktop`, lastModified: now, priority: 0.7 },
  ];
}

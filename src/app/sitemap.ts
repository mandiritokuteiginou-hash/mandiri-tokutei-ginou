import { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";
import { MATERIALS } from "@/lib/materials";

const BASE_URL = "https://mandiritokuteiginou.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/program`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/artikel`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/materi-belajar`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/portal/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/portal/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/kebijakan-privasi`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/syarat-ketentuan`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${BASE_URL}/artikel/${article.slug}`,
    lastModified: article.publishedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const materialRoutes: MetadataRoute.Sitemap = MATERIALS.map((material) => ({
    url: `${BASE_URL}/materi-belajar/${material.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...materialRoutes];
}

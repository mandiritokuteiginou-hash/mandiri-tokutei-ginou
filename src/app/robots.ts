import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://mandiritokuteiginou.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/dashboard", "/admin"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

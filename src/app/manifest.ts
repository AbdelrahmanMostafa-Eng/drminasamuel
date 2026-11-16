import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bioacademy — Dr. Mina Samuel",
    short_name: "Bioacademy",
    description: "ACT2 & EST Biology courses",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#061018",
    theme_color: "#1f607c",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

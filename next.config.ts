import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
       (process.env.NODE_ENV === "development"
         ? "http://localhost:8000"
         : "https://api.devaas.cdipd.in"),
      //(process.env.NODE_ENV === "development"
        //? "https://api.devaas.cdipd.in"
        //: "https://api.devaas.cdipd.in"),
    NEXT_PUBLIC_PASSWORD_EXPIRY_DAYS: "90",
  },
  // Since you're using static export, we can't use headers() function
  // Instead, we'll handle cache control in the component 
  trailingSlash: true,
};

export default nextConfig;

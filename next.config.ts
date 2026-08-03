import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The sidebar nav is fixed to the bottom-left corner (theme toggle), which is
  // also the dev indicator's default position — move the indicator out of the way.
  devIndicators: {
    position: "top-right",
  },
};

export default nextConfig;

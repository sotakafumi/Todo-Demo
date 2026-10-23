import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Todos live in localStorage, so there is no server-side work: `next build` writes plain
  // static files to out/, which GitHub Pages (or scripts/serve.js) can host.
  output: 'export',
  // GitHub Pages serves the site under /<repo>/. The deploy workflow sets this; local builds are
  // served from the root.
  basePath: process.env.PAGES_BASE_PATH ?? '',
};

export default nextConfig;

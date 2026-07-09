/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // pdf-parse (and its pdfjs-dist legacy build) must load from node_modules
  // at runtime rather than being bundled, or the API route fails to parse PDFs.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;

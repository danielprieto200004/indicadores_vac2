import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita que Next detecte como root el home del usuario
  // si existen otros lockfiles fuera del proyecto.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;


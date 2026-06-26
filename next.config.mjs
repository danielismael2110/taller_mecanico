/** @type {import('next').NextConfig} */
const nextConfig = {
    // jspdf / xlsx traen builds para Node que no se bundlean en SSR.
    // Se externalizan: solo se usan en el cliente (manejadores de eventos).
    serverExternalPackages: ["jspdf", "jspdf-autotable", "fflate", "xlsx"],
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
};

export default nextConfig;

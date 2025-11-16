/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        domains: ['cdn.essentiel.work'],
    },
};

export default nextConfig;

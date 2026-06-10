/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias['pdfmake/build/pdfmake'] = false;
      config.resolve.alias['pdfmake/build/vfs_fonts'] = false;
    }
    return config;
  },
};

module.exports = nextConfig

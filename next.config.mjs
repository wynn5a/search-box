/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        turbo: {
            rules: {
                '*.svg': {
                    loaders: ['@svgr/webpack'],
                    as: '*.js',
                },
            }
        }
    },
    // 当使用非 Turbopack 时的 webpack 配置
    webpack: (config, { isServer, dev }) => {
        if (!dev || !process.env.TURBOPACK) {
            config.module.rules.push({
                test: /\.node$/,
                use: 'node-loader'
            })
        }
        return config
    },
    eslint: {
        ignoreDuringBuilds: true
    }
}

import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
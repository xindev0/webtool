import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  esbuild: { charset: 'utf8' },
  build: {
    rollupOptions: {
      input: {
        portal: resolve(__dirname, 'index.html'),
        videoCover: resolve(__dirname, 'tools/video-cover/index.html'),
        videoCoverYouTube: resolve(__dirname, 'tools/video-cover/youtube/index.html'),
        videoCoverBilibili: resolve(__dirname, 'tools/video-cover/bilibili/index.html'),
        videoCoverTikTok: resolve(__dirname, 'tools/video-cover/tiktok/index.html'),
        base64: resolve(__dirname, 'tools/base64/index.html'),
        password: resolve(__dirname, 'tools/password/index.html'),
        qrcode: resolve(__dirname, 'tools/qrcode/index.html'),
        lrc: resolve(__dirname, 'tools/lrc/index.html'),
        clock: resolve(__dirname, 'tools/clock/index.html'),
        chineseConvert: resolve(__dirname, 'tools/chinese-convert/index.html'),
        coin: resolve(__dirname, 'tools/coin/index.html'),
        rps: resolve(__dirname, 'tools/rps/index.html'),
        dice: resolve(__dirname, 'tools/dice/index.html'),
        textCounter: resolve(__dirname, 'tools/text-counter/index.html'),
        jsonFormat: resolve(__dirname, 'tools/json-format/index.html'),
        urlCodec: resolve(__dirname, 'tools/url-codec/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        disclaimer: resolve(__dirname, 'disclaimer/index.html'),
      },
    },
  },
})

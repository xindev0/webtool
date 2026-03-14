# WebTool

[简体中文](README.zh-CN.md)

WebTool is a multi-page collection of lightweight utilities for everyday web tasks. Most tools run directly in the browser, while a small number of media helpers use Cloudflare Pages Functions for same-origin proxying.

## Current Tools

| Tool | Path | Description |
|------|------|-------------|
| Video Cover Downloader | `tools/video-cover/` | Download cover images for YouTube, Bilibili, and TikTok |
| Base64 Encode / Decode | `tools/base64/` | Encode and decode text, images, audio, and files |
| Password Generator | `tools/password/` | Generate random passwords, passphrases, and PINs |
| QR Code Generator | `tools/qrcode/` | Create QR codes with colors, styles, and logo support |
| LRC / SRT / TXT Converter | `tools/lrc/` | Convert between lyric, subtitle, and plain text formats |
| World Clock | `tools/clock/` | Show current time, countdowns, stopwatch, and multiple time zones |
| Chinese Converter | `tools/chinese-convert/` | Convert between simplified and traditional Chinese |
| Coin Flip | `tools/coin/` | Toss a coin for quick decisions |
| Rock Paper Scissors | `tools/rps/` | Play a local round of rock paper scissors |
| Dice Roller | `tools/dice/` | Roll common dice from d4 to d100 |
| Text Counter | `tools/text-counter/` | Count characters, words, lines, paragraphs, bytes, and reading time |
| JSON Formatter | `tools/json-format/` | Format, validate, and minify JSON |
| URL Encoder / Decoder | `tools/url-codec/` | Encode and decode URL text and query parameters |

## Features

- Multi-page Vite setup with dedicated entry HTML files for each tool
- UI languages: `zh-SC`, `zh-TC`, `en-US`, `fr-FR`
- Light and dark theme support
- PWA-ready install experience
- Responsive layout for desktop and mobile
- Share-preview metadata for richer link cards

## Project Structure

- `src/` application source code
- `tools/`, `about/`, `contact/`, `privacy/`, `terms/`, `disclaimer/` HTML entry files
- `functions/api/` Cloudflare Pages Functions
- `public/` static assets such as icons, manifest, and share images

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The production output is written to `dist/`.

## Deploying To Cloudflare Pages

This project works well on Cloudflare Pages with Pages Functions enabled.

Recommended settings:

- Build command: `npm run build`
- Build output directory: `dist`

Optional environment variables:

- `VITE_ADSENSE_ID`
  Use this to inject the AdSense publisher meta tag at build time without hardcoding your publisher ID into the public repository.

## Serverless Endpoints

These endpoints are used by tools that need same-origin proxying:

- `GET /api/bilibili-cover?bvid=BV...`
- `GET /api/tiktok-cover?url=...`
- `GET /api/image-proxy?url=...`

## Notes

- Most tools do not require a backend.
- Media-related helpers may depend on third-party platform responses and can change over time.

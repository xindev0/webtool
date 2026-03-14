# WebTool

[English](README.md)

WebTool 是一个多页面的轻量网页工具集合，面向日常处理媒体、文本、时间和开发类任务。大多数工具直接在浏览器中运行，只有少数媒体相关功能会通过 Cloudflare Pages Functions 做同源代理。

## 当前工具

| 工具 | 路径 | 说明 |
|------|------|------|
| 视频封面下载 | `tools/video-cover/` | 下载 YouTube、Bilibili、TikTok 的封面图 |
| Base64 编解码 | `tools/base64/` | 编码和解码文本、图片、音频及文件内容 |
| 密码生成器 | `tools/password/` | 生成随机密码、词组密码和 PIN |
| 二维码生成器 | `tools/qrcode/` | 生成支持颜色、样式和 Logo 的二维码 |
| LRC / SRT / TXT 转换 | `tools/lrc/` | 在歌词、字幕和纯文本之间转换 |
| 世界时钟 | `tools/clock/` | 查看当前时间、倒计时、秒表和多时区 |
| 简繁转换 | `tools/chinese-convert/` | 在简体和繁体中文之间转换 |
| 抛硬币 | `tools/coin/` | 用于快速做随机决定 |
| 猜拳 | `tools/rps/` | 本地进行石头剪刀布 |
| 掷色子 | `tools/dice/` | 支持 d4 到 d100 的常见骰子 |
| 文本统计 | `tools/text-counter/` | 统计字符、词数、段落、字节和阅读时间 |
| JSON 格式化 | `tools/json-format/` | 格式化、校验并压缩 JSON |
| URL 编解码 | `tools/url-codec/` | 对 URL 文本和查询参数进行编码与解码 |

## 特性

- 使用 Vite 的多页面结构，每个工具都有独立入口
- 支持 `zh-SC`、`zh-TC`、`en-US`、`fr-FR`
- 支持浅色和深色主题
- 支持 PWA 安装体验
- 适配桌面端与移动端
- 支持更完整的链接分享预览元信息

## 项目结构

- `src/` 应用源码
- `tools/`、`about/`、`contact/`、`privacy/`、`terms/`、`disclaimer/` 页面入口
- `functions/api/` Cloudflare Pages Functions
- `public/` 静态资源，例如图标、清单文件和分享图

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建结果会输出到 `dist/`。

## 部署到 Cloudflare Pages

这个项目适合直接部署到 Cloudflare Pages，并启用 Pages Functions。

推荐配置：

- Build command：`npm run build`
- Build output directory：`dist`

可选环境变量：

- `VITE_ADSENSE_ID`
  用于在构建时注入 AdSense 的 publisher meta，不需要把发布商 ID 直接写进公开仓库。

## Serverless 接口

以下接口用于少数需要同源代理的工具：

- `GET /api/bilibili-cover?bvid=BV...`
- `GET /api/tiktok-cover?url=...`
- `GET /api/image-proxy?url=...`

## 说明

- 大多数工具不依赖后端。
- 媒体相关功能依赖第三方平台返回结果，平台策略变化时可能需要调整。

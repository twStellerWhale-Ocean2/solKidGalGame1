# solLingoWorld 整包發行 image（issue #311，spec#27）——單一 app 容器：
# modApi（帳號存檔 API）＋遊戲殼靜態 allowlist（modShell）＋ /admin/ 管理頁（modAdmin）。
# 原始碼樹依 repoStructVersion 2.1 住 sysLingoWorld/（issue #342）；image 內部佈局不變（/app 平鋪），runtime 零差異。
# COPY 範圍以 modApi/src/app.ts 之靜態 allowlist（GAME_SHELL_DIRS＋admin-console）為 SSOT 對齊；
# dev 工具（devtool/、server.mjs）、測試、docs 與 repo 內部檔案一律不入包（intTest#79 步驟 4 守門）。
FROM node:22-alpine AS builder
WORKDIR /build/sysApi
COPY sysLingoWorld/modApi/package.json sysLingoWorld/modApi/package-lock.json ./
RUN npm ci
COPY sysLingoWorld/modApi/tsconfig.json ./
COPY sysLingoWorld/modApi/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
# OCI 標準標籤（issue #343）：source 使 GHCR package 自動關聯本 repo（權限沿用、package 頁顯示 README）。
LABEL org.opencontainers.image.source="https://github.com/twStellerWhale-Ocean2/solLingoWorld" \
      org.opencontainers.image.description="solLingoWorld family self-host bundle: game shell + account/save API + /admin/ console" \
      org.opencontainers.image.licenses="PolyForm-Noncommercial-1.0.0"
ENV NODE_ENV=production
# base 內建 npm CLI（10.x）帶有已公告 HIGH 漏洞之 bundled 依賴（picomatch CVE-2026-33671、
# sigstore CVE-2026-48815；issue #320，發佈列車 #313 Trivy 發車掃描攔下）——升級至 pin 版修補。
# runtime 僅 reset-password 離線後門用到 npm（kubectl exec … npm run reset-password）。
RUN npm install -g npm@12.0.0
WORKDIR /app
COPY --from=builder /build/sysApi/dist ./sysApi/dist
COPY --from=builder /build/sysApi/node_modules ./sysApi/node_modules
COPY sysLingoWorld/modApi/package.json ./sysApi/package.json
COPY sysLingoWorld/modShell/index.html ./index.html
COPY sysLingoWorld/modShell/game-engine ./game-engine
COPY sysLingoWorld/modShell/content-base ./content-base
COPY sysLingoWorld/modShell/content-package ./content-package
COPY sysLingoWorld/modShell/styles ./styles
COPY sysLingoWorld/modAdmin ./admin-console
USER node
EXPOSE 4180
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -q -O /dev/null http://127.0.0.1:4180/healthz || exit 1
WORKDIR /app/sysApi
CMD ["node", "dist/server.js"]

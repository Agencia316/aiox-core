# syntax=docker/dockerfile:1.6
FROM node:20-bookworm-slim

# Native deps:
#  - chromium  → whatsapp-web.js usa Puppeteer (não baixamos o Chromium do Puppeteer)
#  - python3/make/g++  → better-sqlite3 compila bindings nativos
#  - libs gráficas básicas exigidas pelo Chromium em headless
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      python3 \
      make \
      g++ \
      ca-certificates \
      fonts-liberation \
      libnss3 \
      libatk-bridge2.0-0 \
      libdrm2 \
      libgbm1 \
      libxkbcommon0 \
      libasound2 \
      libxshmfence1 \
      libxrandr2 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libpango-1.0-0 \
      libcairo2 \
      libcups2 \
      libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Pula o download do Chromium pelo Puppeteer — usamos o do sistema.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100

WORKDIR /app

# Camada de cache de deps
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Código da aplicação
COPY . .

# Build do Next.js e diretórios de runtime (volumes podem montar por cima)
RUN npm run build && mkdir -p data sessions

EXPOSE 3100

# Migrate roda no primeiro request (applySchema é idempotente). Subimos só o serve.
CMD ["npm", "run", "serve"]

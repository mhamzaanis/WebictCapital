# syntax=docker/dockerfile:1

FROM docker.io/library/node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite configuration is compiled into the browser bundle. These values are
# public build configuration, not runtime container secrets.
ARG VITE_PLATFORM_MODE=PRODUCTION
ARG VITE_MARKET_API_BASE_URL=https://api.webictcapital.com
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""

# Fail the image build before Vite runs when required public configuration is
# absent or malformed. Service-role credentials are intentionally unsupported.
RUN node docker/validate-build-env.mjs

RUN pnpm run build

FROM docker.io/nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --chown=101:101 docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

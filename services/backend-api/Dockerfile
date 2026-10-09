# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install all deps (for build) ----
FROM base AS deps
COPY package*.json ./
RUN npm install

# ---- Compile TypeScript ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production-only deps ----
FROM base AS prod-deps
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# ---- Final runtime image ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health/live || exit 1
CMD ["node", "dist/index.js"]

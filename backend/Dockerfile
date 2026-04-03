FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# ── Dependencies layer ────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ── Development stage ─────────────────────────────────────────
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ── Production stage ─────────────────────────────────────────
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs uploads
EXPOSE 5000
CMD ["node", "server.js"]

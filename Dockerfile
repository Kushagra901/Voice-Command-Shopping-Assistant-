# Multi-stage production build for Node.js Express backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root & workspace package configs
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies across workspaces
RUN npm ci

# Copy source code
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared types and server
RUN npm --prefix shared run build
RUN npm --prefix server run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy built outputs and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/shared/package*.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/assets ./server/assets

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 3001

CMD ["node", "server/dist/index.js"]

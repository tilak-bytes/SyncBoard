# Multi-stage Dockerfile for SyncBoard
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm install --prefix server
RUN npm install --prefix client

# Copy application sources
COPY server/ ./server/
COPY client/ ./client/

# Build client and server
RUN npm run build --prefix client
RUN npm run build --prefix server

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy built server and production node_modules
COPY server/package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/client/dist ./public

EXPOSE 5000

CMD ["node", "dist/index.js"]

FROM node:26-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development: hot reload via tsx watch (used by docker compose)
FROM base AS dev
RUN npm ci
COPY . .
CMD ["node_modules/.bin/tsx", "watch", "src/index.ts"]

# Compile TypeScript
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# Production image: compiled output only
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/index.js"]
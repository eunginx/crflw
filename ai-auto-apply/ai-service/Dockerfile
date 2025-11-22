# syntax=docker/dockerfile:1.4

#############################
# Build Stage
#############################
FROM node:18-alpine as build

WORKDIR /app

# Copy pkg files first (for caching)
COPY package*.json ./

# Use BuildKit cache to speed up npm installs
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

#############################
# Production Stage
#############################
FROM node:18-alpine

WORKDIR /app

# Copy built dist + node_modules from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

# Prune dev dependencies to reduce size
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001

# Adjust permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]

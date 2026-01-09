# syntax=docker/dockerfile:1.4

#############################
# Development Stage (for local development with hot reload)
#############################
FROM node:20-alpine as development

WORKDIR /app

# Copy only the package files for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the full source
COPY . .

# Expose port for development server
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

#############################
# Build Stage
#############################
FROM node:20-alpine as build

WORKDIR /app

# Copy only the package files for better caching
COPY package*.json ./

# Use BuildKit cache to speed up npm installs significantly
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Copy the full source
COPY . .

# Build the CRA app
RUN npm run build

#############################
# Production Stage - Using Node.js server directly
#############################
FROM node:20-alpine

WORKDIR /app

# Copy only the package files for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy the built app from build stage
COPY --from=build /app/build ./build

# Install serve to serve the static files
RUN npm install -g serve

# Expose port 3000 for Docker host mapping
EXPOSE 3000

# Start the server using serve
CMD ["serve", "-s", "build", "-l", "3000"]

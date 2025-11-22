# syntax=docker/dockerfile:1.4

#############################
# Build Stage
#############################
FROM node:18-slim as build

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
# Production Stage with Nginx
#############################
FROM nginx:stable-alpine

# Copy the built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3100 for Docker host mapping
EXPOSE 3100

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

# Multi-stage build for optimized production image
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Vite app
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including dev deps for vite)
COPY package*.json ./
RUN npm ci

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy source code for dev server
COPY . .

# Expose Vite development server port
EXPOSE 5173

# Start Vite dev server with 0.0.0.0 binding for external access
CMD ["npm", "run", "dev"]

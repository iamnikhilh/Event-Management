# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm cache cleanup
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build && rm -rf src

# Dependencies stage - only production deps
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Production stage - distroless for minimal image
FROM gcr.io/distroless/nodejs22-debian11

WORKDIR /app

# Copy node modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Start application
CMD ["dist/main.js"]

# Build stage
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files (paths relative to repo root)
COPY Backend/package*.json ./
COPY Backend/prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY Backend/src ./src/
COPY Backend/tsconfig*.json ./
COPY Backend/nest-cli.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and prisma
COPY Backend/package*.json ./
COPY Backend/prisma ./prisma/

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8000

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

# Multi-stage build for Second Serving
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY Frontend/package*.json ./Frontend/

# Install frontend dependencies
RUN cd Frontend && npm ci

# Copy frontend source code
COPY Frontend/ ./Frontend/

# Copy .env files for build (Vite reads from project root)
# Prioritize .env.production if it exists, otherwise use .env
COPY .env.production* ./
COPY .env* ./

# Build frontend (will use .env.production if NODE_ENV=production)
RUN cd Frontend && npm run build

# Stage 2: Build Backend and combine
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY Backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production

# Copy backend source code
COPY Backend/ ./

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

# Copy .env file for runtime
COPY .env* ./

# Expose port
EXPOSE 8000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the backend server (which will serve frontend in production)
CMD ["node", "server.js"]


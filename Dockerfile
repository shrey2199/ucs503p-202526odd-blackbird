# Multi-stage build for Second Serving
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY Frontend/package*.json ./Frontend/

# Install frontend dependencies
# Use npm ci for reproducible builds (requires package-lock.json)
RUN cd Frontend && npm install

# Copy frontend source code
COPY Frontend/ ./Frontend/

# Copy .env files for build (Vite reads from project root)
# Use RUN with bind mount to copy only if files exist (won't fail if missing)
# Requires BuildKit: DOCKER_BUILDKIT=1 docker build ...
RUN --mount=type=bind,source=.,target=/buildcontext,rw \
    sh -c '[ -f /buildcontext/.env.production ] && cp /buildcontext/.env.production /app/ || true' && \
    sh -c '[ -f /buildcontext/.env ] && cp /buildcontext/.env /app/ || true'

# Build frontend (will use .env.production if NODE_ENV=production)
RUN cd Frontend && npm run build

# Stage 2: Build Backend and combine
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY Backend/package*.json ./

# Install backend dependencies (production only)
# Use npm ci for reproducible builds (requires package-lock.json)
RUN npm install --only=production

# Copy backend source code
COPY Backend/ ./

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/Frontend/dist ./Frontend/dist

# Copy .env file for runtime (won't fail if missing)
# Note: Environment variables should be set via Clever Cloud console, not .env files
# Use RUN with bind mount to copy only if files exist (won't fail if missing)
RUN --mount=type=bind,source=.,target=/buildcontext,rw \
    sh -c '[ -f /buildcontext/.env.production ] && cp /buildcontext/.env.production /app/ || true' && \
    sh -c '[ -f /buildcontext/.env ] && cp /buildcontext/.env /app/ || true'

# Expose port
EXPOSE 8000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the backend server (which will serve frontend in production)
CMD ["node", "server.js"]


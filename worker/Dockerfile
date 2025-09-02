# ---- Base Stage ----
# Use a lightweight, secure Node.js image
FROM node:18-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies first to leverage Docker layer caching. This layer only
# rebuilds when package.json or package-lock.json changes.
FROM base AS deps
# Copy only the package files from the worker directory
COPY worker/package.json worker/package-lock.json* ./
# Install production dependencies
RUN npm ci --only=production

# ---- Builder Stage ----
# Build the TypeScript source code into JavaScript. This layer only rebuilds
# when the worker's source code changes.
FROM base AS builder
WORKDIR /app
# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the worker's source code
COPY worker/ ./
# Build the project
RUN npm run build

# ---- Runner Stage ----
# Create the final, small, and secure production image.
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user for enhanced security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker

# Copy only the necessary built files and dependencies from the builder stage
COPY --from=builder --chown=worker:nodejs /app/dist ./dist
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/package.json ./package.json

# Switch to the non-root user
USER worker

# Command to run the worker
CMD ["npm", "start"]
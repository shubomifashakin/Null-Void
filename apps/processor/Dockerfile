FROM node:24-slim AS builder

WORKDIR /app

# Copy root workspace configuration
COPY package*.json ./

# Copy shared package
COPY shared ./shared

# Copy processor app files
COPY apps/processor/package*.json ./apps/processor/
COPY apps/processor/tsconfig*.json ./apps/processor/
COPY apps/processor/proto ./apps/processor/proto
COPY apps/processor/src ./apps/processor/src

# Install dependencies
RUN npm install

# Build shared first
RUN cd shared && npm run build

# Generate protos and build processor
WORKDIR /app/apps/processor
RUN npm run generate-protos
RUN npm run build

# Production stage
FROM node:24-slim

WORKDIR /app

# Copy ALL node_modules from builder (includes all dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Remove the workspace symlink for shared
RUN rm -rf ./node_modules/@null-void/shared

# Copy the actual built shared package to replace the symlink
COPY --from=builder /app/shared/package.json ./node_modules/@null-void/shared/package.json
COPY --from=builder /app/shared/dist ./node_modules/@null-void/shared/dist

# Copy built processor
COPY --from=builder /app/apps/processor/dist ./dist

# Copy package.json for reference
COPY --from=builder /app/apps/processor/package*.json ./

CMD ["node", "dist/index.js"]
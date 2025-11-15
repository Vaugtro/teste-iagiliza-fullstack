# ---- Builder ----
FROM node:25-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

# Copy the remaining source code
COPY . .

# Generate the Prisma client
RUN pnpm db:gen

# Build the TypeScript project
RUN pnpm build

# ---- Runner ----
FROM node:25-alpine AS runner

WORKDIR /app

# Create a non-root user for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy prisma-related files
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/db/orm/schema.prisma ./src/db/orm/schema.prisma
COPY --from=builder /app/src/db/persist/migrations ./src/db/persist/migrations

# Copy the .env file
COPY --from=builder /app/.env ./.env

# Expose Fastify default port
ENV PORT=3000
EXPOSE 3000

# Start the application and seed the database
CMD sh -c "node -r tsconfig-paths/register dist/db/orm/seed/index.js && node -r tsconfig-paths/register dist/app.js"
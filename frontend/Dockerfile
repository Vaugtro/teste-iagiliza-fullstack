# --- The Builder ---

FROM node:25-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


COPY . .

RUN pnpm run build

FROM node:25-alpine AS runner

RUN npm install -g serve
WORKDIR /app

COPY --from=builder /app/dist .

EXPOSE 3000

CMD ["serve", "-s", "."]
FROM node:24-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

COPY shared ./shared

COPY apps/server/package*.json ./apps/server/
COPY apps/server/tsconfig*.json ./apps/server/
COPY apps/server/prisma ./apps/server/prisma
COPY apps/server/prisma.config.ts ./apps/server/
COPY apps/server/proto ./apps/server/proto
COPY apps/server/src ./apps/server/src

RUN npm install

RUN cd shared && npm run build

WORKDIR /app/apps/server
RUN npx prisma generate
RUN npm run generate-protos
RUN npm run build

FROM node:24-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules

RUN rm -rf ./node_modules/@null-void/shared

COPY --from=builder /app/shared/package.json ./node_modules/@null-void/shared/package.json
COPY --from=builder /app/shared/dist ./node_modules/@null-void/shared/dist

COPY --from=builder /app/apps/server/dist ./dist

COPY --from=builder /app/apps/server/prisma ./prisma

COPY --from=builder /app/apps/server/prisma.config.ts ./prisma.config.ts

COPY --from=builder /app/apps/server/package*.json ./

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
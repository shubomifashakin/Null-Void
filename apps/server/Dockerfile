FROM node:24-slim

WORKDIR /app

COPY package*.json .
COPY tsconfig*.json .
COPY prisma ./prisma
COPY prisma.config.ts .
COPY proto ./proto
COPY src ./src
COPY types ./types

RUN npm install
RUN npx prisma generate
RUN npm run generate-protos
RUN npm run build

CMD ["npm", "run", "start:prod"]
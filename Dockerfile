FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY public/ ./public/

# Default: run the API server. Workers override CMD in docker-compose.
CMD ["npx", "tsx", "src/index.ts"]

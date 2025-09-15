# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src

# Environment defaults (can be overridden by docker-compose)
ENV PORT=3000 \
    NODE_ENV=development

EXPOSE 3000

CMD ["node", "src/server.js"]

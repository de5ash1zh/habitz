# Frontend Dockerfile (development)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

EXPOSE 5173

# Vite dev server: bind to 0.0.0.0 so it's reachable from host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

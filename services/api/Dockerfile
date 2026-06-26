FROM node:20-alpine

WORKDIR /app

# Манифесты монорепо (для кеша установки зависимостей)
COPY package.json package-lock.json ./
COPY services/api/package.json ./services/api/package.json

# Устанавливаем зависимости только для воркспейса api
RUN npm install --omit=dev --workspace services/api

# Исходники api
COPY services/api ./services/api

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "services/api/src/server.js"]

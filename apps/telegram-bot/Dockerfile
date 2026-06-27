FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/

RUN npm install --omit=dev --workspace=apps/telegram-bot

COPY apps/telegram-bot ./apps/telegram-bot

USER node
CMD ["node", "apps/telegram-bot/src/index.js"]

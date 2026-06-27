FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/api/package.json ./services/api/

RUN npm install --omit=dev --workspace=services/api

COPY services/api ./services/api

ENV PORT=8080
EXPOSE 8080

USER node
CMD ["node", "services/api/src/server.js"]

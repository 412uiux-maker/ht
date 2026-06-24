FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json ./
COPY apps/couples/package.json ./apps/couples/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspace=apps/couples

COPY apps/couples/ ./apps/couples/
COPY packages/shared/ ./packages/shared/

RUN npm run build --workspace=apps/couples

FROM nginx:alpine
COPY --from=builder /repo/apps/couples/dist /usr/share/nginx/html
COPY apps/couples/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

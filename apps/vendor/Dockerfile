FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json ./
COPY apps/vendor/package.json ./apps/vendor/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspace=apps/vendor

COPY apps/vendor/ ./apps/vendor/
COPY packages/shared/ ./packages/shared/

RUN npm run build --workspace=apps/vendor

FROM nginx:alpine
COPY --from=builder /repo/apps/vendor/dist /usr/share/nginx/html
COPY apps/vendor/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

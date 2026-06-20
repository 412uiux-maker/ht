FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json ./
COPY apps/admin/package.json ./apps/admin/

RUN npm install --workspace=apps/admin

COPY apps/admin/ ./apps/admin/

RUN npm run build --workspace=apps/admin

FROM nginx:alpine
COPY --from=builder /repo/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

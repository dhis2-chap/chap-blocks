FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @chap-blocks/reference build

FROM nginx:1.28-alpine
ENV CHAP_API_ORIGIN=http://host.docker.internal:8000
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/reference/dist /usr/share/nginx/html
EXPOSE 80

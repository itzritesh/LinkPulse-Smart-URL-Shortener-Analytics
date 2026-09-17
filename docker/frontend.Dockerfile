# ==========================================
# Stage 1: Build Frontend Assets (Root Context)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_BACKEND_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY frontend/package.json ./
RUN npm install --include=dev --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Nginx Runtime
# ==========================================
FROM nginx:1.27-alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

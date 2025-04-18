# Этап 1: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Убедитесь, что скрипт 'build' в вашем package.json существует и собирает статику в папку 'dist'
RUN npm run build 

# Этап 2: Раздача статики с помощью Nginx
FROM nginx:stable-alpine
# Копируем собранные файлы из папки сборки ('dist') в стандартную директорию Nginx
COPY --from=builder /app/dist /usr/share/nginx/html 
# Если нужна кастомная конфигурация Nginx, создайте frontend/nginx.conf и раскомментируйте строку ниже
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD nginx -g 'daemon off;' # Используем shell form

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

COPY package.json package-lock.json* ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev"]
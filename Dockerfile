FROM node:10-alpine AS builder

RUN apk update && apk upgrade && \
    apk add --no-cache --virtual .build-deps make g++ bash openssh git python  && \
    rm -rf /var/cache/apk/*

WORKDIR /app

ENV NODE_ENV=production

COPY ./package.json ./package-lock.json ./

RUN npm i -g typescript

RUN npm ci

COPY ./tsconfig.json ./

COPY ./src/ ./src/

RUN npm run static

RUN tsc --allowJs

FROM node:10-alpine

WORKDIR /app

RUN apk update && apk upgrade && \
    apk add --no-cache --virtual .build-deps make g++ bash openssh git python  && \
    rm -rf /var/cache/apk/*

ENV NODE_ENV=production

COPY ./package.json ./package-lock.json ./

RUN npm ci

RUN apk del .build-deps

COPY --from=builder /app/dist/ ./dist/

CMD ["node", "dist/index.js"]
FROM node:lts-alpine
WORKDIR /app
COPY ./dist/apps/listen-along-server .
COPY package.json package-lock.json ./
ENV PORT=3333
EXPOSE ${PORT}
RUN npm ci --production && npm install reflect-metadata tslib rxjs express
CMD node ./main.js

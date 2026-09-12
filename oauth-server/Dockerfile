FROM node:lts-alpine
WORKDIR /app
COPY package.json ./
COPY server.mjs ./
EXPOSE 8081
CMD ["node", "server.mjs"]

FROM node:20-alpine
RUN apk add --no-cache git docker-cli
WORKDIR /app
COPY server.js .
EXPOSE 9000
CMD ["node", "server.js"]

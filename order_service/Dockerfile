FROM node:24.14-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
COPY /src ./src
RUN npm ci --silent
RUN npm run build
RUN npm ci --silent --omit=dev

FROM node:24.14-alpine AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3001
CMD [ "node", "./dist/index.js" ]

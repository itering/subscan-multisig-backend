FROM node:14-slim as builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install

ADD . .
RUN yarn run build

FROM node:14-slim

WORKDIR /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/dist/src .
COPY --from=builder /app/node_modules/ node_modules/

EXPOSE 9000
CMD [ "node", "-r", "module-alias/register", "." ]

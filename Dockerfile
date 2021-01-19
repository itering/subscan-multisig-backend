FROM node:12 as builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install

ADD . .
RUN yarn run build

FROM node:12

WORKDIR /app
COPY --from=builder /app/dist/src .

EXPOSE 9000
CMD [ "node", "-r", "module-alias/register", "/app" ]

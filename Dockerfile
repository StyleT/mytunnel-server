FROM node:14-alpine

WORKDIR /codebase

COPY package.json /codebase/
COPY package-lock.json /codebase/

RUN npm install --production

COPY . /codebase

ENV NODE_ENV production
ENTRYPOINT ["./bin/server.js"]

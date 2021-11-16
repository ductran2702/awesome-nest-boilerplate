FROM node:lts AS dist
COPY package.json ./

RUN yarn install

COPY . ./

RUN yarn build:prod

FROM node:lts AS node_modules
COPY package.json ./

RUN yarn install --prod

FROM node:lts

ARG PORT=5000

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY --from=dist dist /usr/src/app/dist
COPY --from=node_modules node_modules /usr/src/app/node_modules

#COPY . /usr/src/app

ENV PORT=$PORT
EXPOSE $PORT

CMD [ "yarn", "start:prod" ]

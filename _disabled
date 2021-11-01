FROM node:14

WORKDIR /usr/src/app

copy package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .
COPY .env .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 8080
CMD ["node", "dist/index.js"]
USER node
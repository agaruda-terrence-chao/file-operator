FROM node:14.16.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001-3016
CMD ["node", "./bin/www"]

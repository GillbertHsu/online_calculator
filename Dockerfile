FROM node:16

WORKDIR gilbert_calculator_docker

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD [ "node", "app.js" ]
FROM python:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY server/databases-creation.py /usr/src/app/

CMD ["databases-creation.py", "-flag"]

FROM node:latest

RUN npm install -g nodemon

WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

EXPOSE 3000

CMD [ "npm", "run", "dev" ]

FROM python:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY server/databases-creation.py /usr/src/app/

CMD ["databases-creation.py", "-flag"]
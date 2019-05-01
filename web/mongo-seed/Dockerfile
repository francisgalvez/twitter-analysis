FROM python:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY databases-creation.py /usr/src/app/

CMD ["databases-creation.py", "-flag"]
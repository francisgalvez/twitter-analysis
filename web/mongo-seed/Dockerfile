FROM python:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY databases-creation.py /usr/src/app/

ENTRYPOINT ["python3"]

CMD ["databases-creation.py"]
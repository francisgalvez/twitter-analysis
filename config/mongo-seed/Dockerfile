FROM python:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY databases-creation.py /usr/src/app/
COPY secret.py /usr/src/app/

RUN easy_install pymongo

ENTRYPOINT ["python3"]

CMD ["databases-creation.py"]

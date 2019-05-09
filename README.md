# twitter-analysis
Desarrollo de un sitio web que muestre en tiempo real las zonas geográficas donde se está hablando sobre diferentes 
motores de bases de datos, usando para ello datos de Twitter.

La aplicación hace uso de PySpark para producir, consumir y evaluar los datos. Kafka se usará como vehículo para 
publicar los "mensajes" (tweets) al consumidor. 

La base de datos utilizada para almacenar los tweets es MongoDB, mientras que para almacenar datos sobre ubicaciones y 
sus coordenadas se usa una caché Redis.

## Antes de empezar
Antes de ejecutar el trabajo Spark, se han de instalar los siguientes paquetes:
    pip install redis
    pip install unidecode
    pip install pandas
    pip install pymongo
    pip install tweepy
    pip install kafka

Además, deberás registrarte en la plataforma de desarrolladores de Twitter (https://developer.twitter.com/), crear una aplicación y conseguir las claves para poder acceder a su API.

## Puesta en marcha del trabajo Spark
### 1. Crear topic
    bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --topic twitter

### 2. Iniciar Zookeeper:
    bin/zookeeper-server-start.sh config/zookeeper.properties

### 3. Iniciar Kafka:
    bin/kafka-server-start.sh config/server.properties

### 4. Iniciar Redis:
    sudo service redis-server start

### 5. Iniciar producer
    python producer.py

### 6. Iniciar consumer:
    spark-submit --jars elasticsearch-hadoop-7.0.0.jar --packages org.apache.spark:spark-streaming-kafka-0-8_2.11:2.2.0,org.mongodb.spark:mongo-spark-connector_2.11:2.4.0 spark-consumer.py

### 7. Ver topic 'twitter':
    bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic twitter --from-beginning

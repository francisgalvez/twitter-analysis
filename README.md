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

## Puesta en marcha del trabajo Spark
### 1. Iniciar Zookeeper:
    bin/zookeeper-server-start.sh config/zookeeper.properties

### 2. Iniciar Kafka:
    bin/kafka-server-start.sh config/server.properties

### 3. Iniciar Redis:
    sudo service redis-server start

### 4. Iniciar producer
    python producer.py

### 5. Iniciar consumer:
    spark-submit --jars elasticsearch-hadoop-7.0.0.jar --packages org.apache.spark:spark-streaming-kafka-0-8_2.11:2.2.0,org.mongodb.spark:mongo-spark-connector_2.11:2.4.0 spark-consumer.py

### 6. Ver topic 'twitter':
    bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic twitter --from-beginning

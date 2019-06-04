# twitter-analysis
This project uses Apache Kafka and Spark Streaming together with the Twitter Standard Streaming API in order to filter the tweets that are being produced related to certain topics.

This application has a [producer](https://github.com/francisgalvez/twitter-analysis/blob/master/producer.py), which is a Python script that filters Twitter data through Tweepy module. Besides, the [Spark consumer](https://github.com/francisgalvez/twitter-analysis/blob/master/spark-consumer.py) uses PySpark to consume, process and save the data in four different databases:

* Elasticsearch: Main database in which all the filtered tweets are saved since the beginning.
* MongoDB: Three databases, one per each hour segment (from the last 2, 4 or 6 hours).
    
In order to obtain the location of each tweet, this app doesn't only use the tweet's coordinates, but when it doesn't have a known location, we use the user's biography location. Thus, through the Data Science Toolkit API, we can obtain the coordinates of a given address and be able to save them alongside the tweet. In this sense, we use a Redis cache to avoid huge numbers of API requests. So, when an address coordinates are requested to the mentioned API, they are saved in the cache, and the next time the same address appears, the app won't have to request the API, just search in Redis.

The final purpose of the app is to be able to show the tweets of which we have location data. They will all be displayed in a map, as can be seen in [this repo](https://github.com/francisgalvez/twitter-analysis-web). 

## Before getting started
Before executing the Spark job, you will have to install the following modules:
```
pip install redis
pip install unidecode
pip install pandas
pip install pymongo
pip install tweepy
pip install kafka
```

Moreover, you'll have to sign up the [Twitter Developers Platform](https://developer.twitter.com/), create an application and get the keys to be able to access their API.

**Note**: This project has been executed through Kafka and Spark clusters, so you'll have to change either the hosts and ports of the machines (in the producer or the consumer) or the Spark execution command.

## Starting up
### 1. Create topic
    bin/kafka-topics.sh --create --bootstrap-server <host>:9092 --topic twitter

### 2. Initialize Zookeeper server:
    bin/zookeeper-server-start.sh config/zookeeper.properties

### 3. Initialize Kafka server:
    bin/kafka-server-start.sh config/server.properties

### 4. Initialize Redis:
    sudo service redis-server start

### 5. Execute producer
    python producer.py

### 6. Execute consumer:
    /opt/spark/bin/spark-submit --master spark://spark-master:7077 --deploy-mode=client --driver-class-path=/home/ubuntu/twitter-analysis/jars/elasticsearch-hadoop-7.0.0.jar --packages org.apache.spark:spark-streaming-kafka-0-8_2.11:2.2.0,org.mongodb.spark:mongo-spark-connector_2.11:2.4.0,org.elasticsearch:elasticsearch-spark-20_2.11:7.0.0 local:///home/ubuntu/twitter-analysis/spark-consumer.py

### 7. See 'twitter' topic:
    bin/kafka-console-consumer.sh --bootstrap-server <host>:9092 --topic twitter --from-beginning

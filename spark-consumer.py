from pyspark import SparkConf, SparkContext
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils
from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.types import StructType, StructField, StringType, BooleanType
import json


def parse_json(df):
    id = df['id']

    if 'android' or 'Android' in df['source']:
        source = 'Android'
    elif 'iphone' or 'iPhone' in df['source']:
        source = 'iPhone'
    elif 'Web Client' in df['source']:
        source = 'Web Client'
    else:
        source = 'Unknown'

    user_id = df['user']['id']
    user_location = df['user']['location']

    # Si tenemos ubicación exacta, es decir, coordinates != null, las cogemos antes que place
    if df['coordinates'] is not None:
        tweet_location = df['coordinates']['coordinates']
    else:
        if df['place'] is not None:
            tweet_location = df['place']['bounding_box']['coordinates'][0][0]
        else:
            tweet_location = None

    if 'possibly_sensitive' in df:
        sensitive = df['possibly_sensitive']
    else:
        sensitive = False

    lang = df['lang']
    timestamp = df['timestamp_ms']

    return [id, source, user_id, user_location, tweet_location, sensitive, lang, timestamp]


def write_to_mongo(tweet):
    tweet.write.format("com.mongodb.spark.sql.DefaultSource").mode("append").save()


tweet_schema = StructType([
                    StructField("id", StringType(), False),
                    StructField("source", StringType(), True),
                    StructField("user_id", StringType(), False),
                    StructField("user_location", StringType(), True),
                    StructField("tweet_location", StringType(), True),
                    StructField("sensitive", BooleanType(), True),
                    StructField("lang", StringType(), True),
                    StructField("timestamp", StringType(), False)
                    ])

#  1. Create Spark configuration
conf = SparkConf().setAppName("TwitterAnalysis").setMaster("local[*]")

# Create Spark Context to Connect Spark Cluster
sc = SparkContext(conf=conf)

# Set the Batch Interval is 10 sec of Streaming Context
ssc = StreamingContext(sc, 10)

spark = SparkSession \
    .builder \
    .appName("TwitterAnalysis") \
    .config("spark.mongodb.output.uri", "mongodb://127.0.0.1/twitter.coll") \
    .getOrCreate()

# Create Kafka Stream to Consume Data Comes From Twitter Topic
kafkaStream = KafkaUtils.createDirectStream(ssc, topics=['twitter'], kafkaParams={"metadata.broker.list": 'localhost:9092'})

parsedJSON = kafkaStream.map(lambda x: parse_json(json.loads(x[1])))

parsedJSON.foreachRDD(lambda rdd: write_to_mongo(spark.createDataFrame(rdd, tweet_schema)))

# Start Execution of Streams
ssc.start()
ssc.awaitTermination()

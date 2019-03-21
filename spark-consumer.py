from pyspark import SparkConf, SparkContext
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils
from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.types import StructType, StructField, StringType, BooleanType
import json
from datetime import datetime
import redis
import requests
import unidecode
import string


def parse_json(df):
    id = df['id']

    text = df['text']

    if 'android' or 'Android' in df['source']:
        source = 'Android'
    elif 'iphone' or 'iPhone' in df['source']:
        source = 'iPhone'
    elif 'Web Client' in df['source']:
        source = 'Web Client'
    else:
        source = 'Unknown'

    user_name = df['user']['screen_name']

    # Si tenemos ubicación exacta, es decir, coordinates != null, las cogemos antes que place
    if df['coordinates'] is not None:
        location = df['coordinates']['coordinates']
    else:
        if df['place'] is not None:
            location = df['place']['bounding_box']['coordinates'][0][0]
        else:
            # Si no tenemos la localización del tweet, cogemos la del usuario autor del tweet
            if df['user']['location'] is not None:
                location = get_coordinates(df['user']['location'])
            else:
                location = None

    if 'possibly_sensitive' in df:
        sensitive = df['possibly_sensitive']
    else:
        sensitive = False

    lang = df['lang']
    timestamp = df['timestamp_ms']

    # Para obtener la fecha, dividimos el timestamp entre 1000 (viene en ms)
    date = datetime.utcfromtimestamp(int(timestamp)/1000).strftime('%Y-%m-%d %H:%M:%S')

    return [id, text, source, user_name, location, sensitive, lang, timestamp, date]


def get_coordinates(address):
    # Parsed address
    encoded_location = address.lower().translate(str.maketrans('', '', string.punctuation))
    # Eliminamos caracteres especiales
    decoded_location = unidecode.unidecode(encoded_location)

    response = get_cached_location(str(decoded_location))

    if response is not None:
        return response
    else:
        api_response = requests.get(
            'http://www.datasciencetoolkit.org/maps/api/geocode/json?address=' + str(decoded_location))

        if api_response is not None:
            try:
                api_response_dict = api_response.json()
            except json.decoder.JSONDecodeError:
                return None

            if api_response_dict['status'] == 'OK':
                latitude = api_response_dict['results'][0]['geometry']['location']['lat']
                longitude = api_response_dict['results'][0]['geometry']['location']['lng']
                set_cached_location(decoded_location, latitude, longitude)
                location = "[" + str(latitude) + "," + str(longitude) + "]"
                return location
            else:
                set_cached_location(address, None, None)
                return None
        else:
            set_cached_location(address, None, None)
            return None


def get_cached_location(key):
    my_server = redis.Redis(connection_pool=redis.ConnectionPool(host='localhost', port=6379, decode_responses=True, db=0))
    return my_server.get(key)


def set_cached_location(nombre, latitud, longitud):
    my_server = redis.Redis(connection_pool=redis.ConnectionPool(host='localhost', port=6379, decode_responses=True, db=0))
    my_server.set(nombre, str([latitud, longitud]).encode('utf-8'))


def write_to_database(tweet):
    tweet.write.format("com.mongodb.spark.sql.DefaultSource").mode("append").save()


tweet_schema = StructType([
                    StructField("id", StringType(), False),
                    StructField("text", StringType(), False),
                    StructField("source", StringType(), True),
                    StructField("user_name", StringType(), False),
                    StructField("location", StringType(), True),
                    StructField("sensitive", BooleanType(), True),
                    StructField("lang", StringType(), True),
                    StructField("timestamp", StringType(), False),
                    StructField("date", StringType(), False)
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

parsedJSON.foreachRDD(lambda rdd: write_to_database(spark.createDataFrame(rdd, tweet_schema)))

# Start Execution of Streams
ssc.start()
ssc.awaitTermination()

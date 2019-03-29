from pyspark import SparkConf, SparkContext
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils
from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.types import StructType, StructField, StringType, BooleanType, ArrayType, DoubleType
import json
from datetime import datetime
import redis
import requests
import unidecode
import string
import ast


def parse_json(df):
    id = df['id']

    if 'extended_tweet' in df:
        text = df['extended_tweet']['full_text']
    elif 'retweeted_status' in df:
        if 'extended_tweet' in df['retweeted_status']:
            text = df['retweeted_status']['extended_tweet']['full_text']
        else:
            text = df['text']
    else:
        text = df['text']

    text_lower = text.lower()

    topics = []

    if 'oracle' in text_lower:
        topics.append('Oracle')
    if 'mysql' in text_lower:
        topics.append('MySQL')
    if 'sql server' or 'sqlserver' in text_lower:
        topics.append('SQL Server')
    if 'postgres' in text_lower:
        topics.append('PostgreSQL')
    if 'mongo' in text_lower:
        topics.append('MongoDB')
    if 'ibm db2' or 'ibm' or 'db2' in text_lower:
        topics.append('IBM db2')
    if 'microsoft access' in text_lower:
        topics.append('Access')
    if 'redis' in text_lower:
        topics.append('Redis')
    if 'elasticsearch' in text_lower:
        topics.append('Elasticsearch')
    if 'sqlite' in text_lower:
        topics.append('SQLite')

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

    return [id, topics, text, source, user_name, location, sensitive, lang, timestamp, date]


def get_coordinates(address):
    # Parsed address
    encoded_location = address.lower().translate(str.maketrans('', '', string.punctuation))
    # Eliminamos caracteres especiales
    decoded_location = unidecode.unidecode(encoded_location)

    response = get_cached_location(str(decoded_location))

    if response is not None:
        return ast.literal_eval(response)
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
                set_cached_location(decoded_location, longitude, latitude)
                location = [float(longitude), float(latitude)]
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


def set_cached_location(name, longitude, latitude):
    my_server = redis.Redis(connection_pool=redis.ConnectionPool(host='localhost', port=6379, decode_responses=True, db=0))
    my_server.set(name, str([longitude, latitude]))


def write_to_database(tweet):
    tweet.write.format('com.mongodb.spark.sql.DefaultSource').mode('append').save()


tweet_schema = StructType([
                    StructField('id', StringType(), False),
                    StructField('topics', ArrayType(StringType()), False),
                    StructField('text', StringType(), False),
                    StructField('source', StringType(), True),
                    StructField('user_name', StringType(), False),
                    StructField('location', ArrayType(DoubleType()), True),
                    StructField('sensitive', BooleanType(), True),
                    StructField('lang', StringType(), True),
                    StructField('timestamp', StringType(), False),
                    StructField('date', StringType(), False)
                    ])

#  1. Create Spark configuration
conf = SparkConf().setAppName('TwitterAnalysis').setMaster('local[*]')

# Create Spark Context to Connect Spark Cluster
sc = SparkContext(conf=conf)

# Set the Batch Interval is 10 sec of Streaming Context
ssc = StreamingContext(sc, 10)

spark = SparkSession \
    .builder \
    .appName('TwitterAnalysis') \
    .config('spark.mongodb.output.uri', 'mongodb://127.0.0.1/twitter.coll') \
    .getOrCreate()

# Create Kafka Stream to Consume Data Comes From Twitter Topic
kafkaStream = KafkaUtils.createDirectStream(ssc, topics=['twitter'], kafkaParams={'metadata.broker.list': 'localhost:9092'})

parsedJSON = kafkaStream.map(lambda x: parse_json(json.loads(x[1])))

parsedJSON.foreachRDD(lambda rdd: write_to_database(spark.createDataFrame(rdd, tweet_schema)))

# Start Execution of Streams
ssc.start()
ssc.awaitTermination()

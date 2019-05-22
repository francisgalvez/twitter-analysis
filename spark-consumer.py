from pyspark import SparkConf, SparkContext
from pyspark.streaming import StreamingContext
from pyspark.streaming.kafka import KafkaUtils
from pyspark.sql import SparkSession
from pyspark.sql.types import StructType, StructField, StringType, BooleanType, ArrayType, DoubleType, IntegerType
from pymongo import MongoClient
from secret import MONGO_USER, MONGO_PASSWORD
import json
from datetime import datetime
import redis
import requests
import unidecode
import string


def parse_json(df, topics):
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
    tweet_topics = []

    for index, row in topics.iterrows():
        for keyword in row['keywords']:
            if keyword in text_lower:
                if row['name'] not in tweet_topics:
                    tweet_topics.append(str(row['name']))

    if 'android' in df['source'].lower():
        source = 'Android'
    elif 'iphone' in df['source'].lower():
        source = 'iPhone'
    elif 'Web Client' in df['source']:
        source = 'Web Client'
    else:
        source = 'Otros'

    retweet_count = df['retweet_count']
    favorite_count = df['favorite_count']
    hashtags_count = df['entities']['hashtags'].count()
    user_mentions_count = df['entities']['user_mentions'].count()

    user_name = df['user']['screen_name']
    followers = df['user']['followers_count']
    followed_by = df['user']['friends_count']
    verified = df['user']['verified']
    geo_enabled = df['user']['geo_enabled']

    # Si tenemos ubicación exacta (coordinates != null) las cogemos antes que place
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

    return [id, tweet_topics, text, source, retweet_count, favorite_count, hashtags_count, user_mentions_count, user_name, followed_by, followed_by, verified, geo_enabled, location, sensitive, lang, timestamp, date]


def get_coordinates(address):
    # Parsed address
    encoded_location = address.lower().translate(str.maketrans('', '', string.punctuation))
    # Eliminamos caracteres especiales
    decoded_location = unidecode.unidecode(encoded_location)

    response = get_cached_location(str(decoded_location))

    if response is not None:
        try:
            return json.loads(response)
        except json.decoder.JSONDecodeError:
            return None
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

                # Restringir localizaciones ficticias
                if location is not [0.0, 0.0]:
                    return location
                else:
                    return None
            else:
                set_cached_location(address, None, None)
                return None
        else:
            set_cached_location(address, None, None)
            return None


def get_cached_location(key):
    my_server = redis.Redis(connection_pool=redis.ConnectionPool(host='21.0.0.11', port=6379, decode_responses=True, db=0))
    return my_server.get(key)


def set_cached_location(name, longitude, latitude):
    my_server = redis.Redis(connection_pool=redis.ConnectionPool(host='21.0.0.11', port=6379, decode_responses=True, db=0))
    my_server.set(name, str([longitude, latitude]))


def write_to_databases(tweet, databases):
    for index, row in databases.iterrows():
        if row['engine'] == "elasticsearch":
            tweet.write.format('org.elasticsearch.spark.sql').mode('append').option('es.nodes', row['host']).option('es.port', int(row['port'])).option('es.resource', row['index'] + "/" + row['doc_type']).save()
        elif row['engine'] == "mongo":
            URI = 'mongodb://' + MONGO_USER + ':' + MONGO_PASSWORD + '@' + row['URI'] + row['database_name'] + "." + row['collection'] + '?authSource=' + row['database_name']
            tweet.write.format('com.mongodb.spark.sql.DefaultSource').mode('append').option('uri', URI).save()


tweet_schema = StructType([
                    StructField('id', StringType(), False),
                    StructField('topics', ArrayType(StringType()), False),
                    StructField('text', StringType(), False),
                    StructField('source', StringType(), False),
                    StructField('retweet_count', IntegerType(), False),
                    StructField('favorite_count', IntegerType(), False),
                    StructField('hashtags_count', IntegerType(), False),
                    StructField('user_mentions_count', IntegerType(), False),
                    StructField('user_name', StringType(), False),
                    StructField('followers', IntegerType(), False),
                    StructField('followed_by', IntegerType(), False),
                    StructField('verified', BooleanType(), False),
                    StructField('geo_enabled', BooleanType(), False),
                    StructField('location', ArrayType(DoubleType()), True),
                    StructField('sensitive', BooleanType(), True),
                    StructField('lang', StringType(), True),
                    StructField('timestamp', StringType(), False),
                    StructField('date', StringType(), False)
                    ])


if __name__ == '__main__':
    #  1. Create Spark configuration
    conf = SparkConf().setAppName('TwitterAnalysis')

    # Create Spark Context to Connect Spark Cluster
    sc = SparkContext(conf=conf)

    # Set the Batch Interval is 10 sec of Streaming Context
    ssc = StreamingContext(sc, 10)

    spark = SparkSession \
        .builder \
        .appName('TwitterAnalysis') \
        .config('spark.mongodb.output.uri') \
	.getOrCreate()

    # Conversion to Pandas DataFrame
    topics = spark.read.format("com.mongodb.spark.sql.DefaultSource").option("uri", 'mongodb://' + MONGO_USER + ':' + MONGO_PASSWORD + '@' + '21.0.0.11/settings.topics').load()
    databases = spark.read.format("com.mongodb.spark.sql.DefaultSource").option("uri", 'mongodb://' + MONGO_USER + ':' + MONGO_PASSWORD + '@' + '21.0.0.11/settings.databases').load()

    topics_pandas = topics.toPandas()
    databases_pandas = databases.toPandas()

    # Create Kafka Stream to Consume Data Comes From Twitter Topic
    kafkaStream = KafkaUtils.createDirectStream(ssc, topics=['twitter'], kafkaParams={'metadata.broker.list': '21.0.0.6:9092, 21.0.0.12:9092, 21.0.0.13:9092'})

    parsedJSON = kafkaStream.map(lambda x: parse_json(json.loads(x[1]), topics_pandas))

    parsedJSON.foreachRDD(lambda rdd: write_to_databases(spark.createDataFrame(rdd, tweet_schema), databases_pandas))

    # Start Execution of Streams
    ssc.start()
    ssc.awaitTermination()

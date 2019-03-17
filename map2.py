from pyspark.sql import SparkSession
import requests
import json
import folium
import redis
import time


def getLocation(key):
    my_server = redis.Redis(connection_pool=POOL)
    return my_server.get(key)


def setLocation(nombre, latitud, longitud):
    my_server = redis.Redis(connection_pool=POOL)
    my_server.set(nombre, str([latitud, longitud]).encode('utf-8'))


def map_tut(list):
    m = folium.Map(location=[20,0], tiles="Mapbox Bright", zoom_start=2)

    for coord in list:
        lat = coord.split(',')[0].split('[')[1]
        lon = coord.split(',')[1].split(']')[0]
        folium.Marker([float(lat), float(lon)]).add_to(m)

    m.save('twitter_plot_cache1.html')

spark = SparkSession \
    .builder \
    .appName("TwitterAnalysis") \
    .config("spark.mongodb.input.uri", "mongodb://127.0.0.1/twitter.coll") \
    .getOrCreate()

read = spark.read.format("com.mongodb.spark.sql.DefaultSource").load()

POOL = redis.ConnectionPool(host='localhost', port=6379, decode_responses=True, db=0)

tweets_rdd = read.rdd.map(lambda x: (x.user_location, x.tweet_location))

coordenadas = []
ubicaciones = []
count_cached = 0

'''
    tweet[0] = user_location
    tweet[1] = tweet_location
'''

# Iteramos sobre el RDD de tweets para sacar una localización
for tweet in tweets_rdd.collect():
    if tweet[1] is not None:
        coordenadas.append(tweet[1])
    else:
        if tweet[0] is not None:
            ubicaciones.append(tweet[0])


# Get coordinates from a given name (Google API)
start_time = time.time()

for address in ubicaciones:
    response = getLocation(address)

    if response is not None:
        """
        longitude = response[1]
        latitude = response[0]
        coordenadas.append("[" + str(latitude) + "," + str(longitude) + "]")
        """
        count_cached += 1
        coordenadas.append(response)

    else:
        api_response = requests.get('http://www.datasciencetoolkit.org/maps/api/geocode/json?address=' + str(address))

        if api_response is not None:
            try:
                api_response_dict = api_response.json()
            except json.decoder.JSONDecodeError:
                continue

            if api_response_dict['status'] == 'OK':
                latitude = api_response_dict['results'][0]['geometry']['location']['lat']
                longitude = api_response_dict['results'][0]['geometry']['location']['lng']
                setLocation(address, latitude, longitude)
                coordenadas.append("[" + str(latitude) + "," + str(longitude) + "]")


print("--- %s seconds ---" % (time.time() - start_time))
print("Total instancias ubicaciones: " + str(len(ubicaciones)))
print("Total ubicaciones obtenidas de cache:" + str(count_cached))

map_tut(coordenadas)
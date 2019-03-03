from pyspark.sql import SparkSession
import requests
import folium


def map_tut(list):
    m = folium.Map(location=[20,0], tiles="Mapbox Bright", zoom_start=2)

    for coord in list:
        lat = coord.split(',')[0].split('[')[1]
        lon = coord.split(',')[1].split(']')[0]
        folium.Marker([float(lon), float(lat)]).add_to(m)

    m.save('twitter_plot.html')


google_api_key = "AIzaSyAP4Ib-SHglTmYto6HabcS2bbIlmzT10_k"

spark = SparkSession \
    .builder \
    .appName("TwitterAnalysis") \
    .config("spark.mongodb.input.uri", "mongodb://127.0.0.1/twitter.coll") \
    .getOrCreate()

read = spark.read.format("com.mongodb.spark.sql.DefaultSource").load()

df = read.select("id", "source", "user_id", "user_location", "tweet_location", "sensitive", "lang", "timestamp")

tweets_rdd = df.rdd.map(lambda x: (x.user_location, x.tweet_location))

coordenadas = []
ubicaciones = []

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
for address in ubicaciones:
    api_response = requests.get('http://www.datasciencetoolkit.org/maps/api/geocode/json?address=' + str(address))
    api_response_dict = api_response.json()

    print(str(api_response_dict['status']))

    if api_response_dict['status'] == 'OK':
        latitude = api_response_dict['results'][0]['geometry']['location']['lat']
        longitude = api_response_dict['results'][0]['geometry']['location']['lng']
        coordenadas.append("[" + str(latitude) + "," + str(longitude) + "]")


map_tut(coordenadas)

from pyspark.sql import SparkSession
import geojson
import pandas as pd
import ast


def data2geojson(df):
    features = []

    # Coordenadas según el orden (lon, lat)
    insert_features = lambda tweet: features.append(geojson.Feature(geometry=geojson.Point((ast.literal_eval(str(tweet['location']))[1], ast.literal_eval(str(tweet['location']))[0])),
                                                                    properties=dict(id=tweet["id"],
                                                                                    text=tweet["text"],
                                                                                    source=tweet["source"],
                                                                                    user_id=tweet["user_id"],
                                                                                    sensitive=tweet["sensitive"],
                                                                                    lang=tweet["lang"],
                                                                                    timestamp=tweet["timestamp"],
                                                                                    date=tweet["date"]
                                                                                    )))
    df.apply(insert_features, axis=1)
    with open('temp.geojson', 'w', encoding='utf8') as fp:
        geojson.dump(geojson.FeatureCollection(features), fp, sort_keys=True, ensure_ascii=False)


spark = SparkSession \
    .builder \
    .appName("TwitterAnalysis") \
    .config("spark.mongodb.input.uri", "mongodb://127.0.0.1/twitter.coll") \
    .getOrCreate()

df = spark.read.format("com.mongodb.spark.sql.DefaultSource").load()

# Filtrar por los que tengan localización no nula
tweets_located_df = df.filter(df['location'] != 'null')

col = ['id', 'text', 'source', 'user_id', 'location', 'sensitive', 'lang', 'timestamp', 'date']

df = pd.DataFrame(tweets_located_df.toPandas(), columns=col)

data2geojson(df)

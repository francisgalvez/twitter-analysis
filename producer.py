''''
    1. Iniciar Zookeeper:
        bin/zookeeper-server-start.sh config/zookeeper.properties

    2. Iniciar Kafka:
        bin/kafka-server-start.sh config/server.properties

    3. Iniciar producer

    4. Iniciar consumer: spark-submit --packages org.apache.spark:spark-streaming-kafka-0-8_2.11:2.2.0,org.mongodb.spark:mongo-spark-connector_2.11:2.4.0 spark-consumer.py

    5. Ver topic desde el principio:
        bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic twitter --from-beginning
'''

import tweepy
from kafka import SimpleProducer, KafkaClient
from secret import consumer_key, consumer_secret, access_token, access_token_secret

def get_auth():
    auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)
    return auth

class MyStreamListener(tweepy.StreamListener):
    def on_data(self, data):
        # Producer produces data for consumer
        # Data comes from Twitter
        producer.send_messages("twitter", data.encode('utf-8'))
        return True

    def on_error(self, status):
        print(status)

if __name__ == '__main__':
    # localhost:9092 = Default Zookeeper Producer Host and Port Adresses
    kafka = KafkaClient("localhost:9092")
    producer = SimpleProducer(kafka)

    # Get an API item using tweepy
    auth = get_auth()  # Retrieve an auth object using the function 'get_auth' above
    api = tweepy.API(auth)  # Build an API object.

    # Connect to the stream
    myStreamListener = MyStreamListener()
    myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)

    keywords = ['eurovision', 'Eurovision2019', 'ESC2019', 'ESC 2019', '#ESC', '#DareToDream', '#EurovisionSongContest',
                '#EurovisionYouDecide', '#DestinationEurovision', '#EurovisionParty', '#AllAboard', 'Melodifestivalen',
                'melfest', 'eurodrama']
    
    myStream.filter(track=keywords)
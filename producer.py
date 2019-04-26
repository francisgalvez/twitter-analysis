import tweepy
from kafka import SimpleProducer, KafkaClient
from pymongo import MongoClient
from secret import consumer_key, consumer_secret, access_token, access_token_secret


def get_auth():
    auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)
    return auth


class MyStreamListener(tweepy.StreamListener):
    def on_data(self, data):
        # Producer produces data for consumer
        # Data comes from Twitter
        producer.send_messages('twitter', data.encode('utf-8'))
        return True

    def on_error(self, status):
        print(status)


if __name__ == '__main__':
    # localhost:9092 = Default Zookeeper Producer Host and Port Adresses
    kafka = KafkaClient('localhost:9092')
    producer = SimpleProducer(kafka)

    # Get an API item using tweepy
    auth = get_auth()  # Retrieve an auth object using the function 'get_auth' above
    api = tweepy.API(auth)  # Build an API object.

    # Connect to the stream
    myStreamListener = MyStreamListener()
    myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)

    # Connect to settings database and extract topics
    client = MongoClient('mongodb://localhost:27017/')
    topics = client['settings']['topics'].find()

    keywords = []

    for topic in topics:
        for name in topic['topics']:
            keywords.append(name)
    
    print(keywords)
    
    myStream.filter(track=keywords)

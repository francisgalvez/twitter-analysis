from pymongo import MongoClient
from secret import MONGO_USER, MONGO_PASSWORD


databases = [
                {
                  "engine": "elasticsearch",
                  "name": "mainDbES", 
                  "URI": "192.168.67.15:9200",
                  "host": "192.168.67.15",
                  "port": "9200",
                  "index": "twitter_map",
                  "doc_type": "_doc"
                },

                {
                  "engine": "redis",
                  "name": "redis", 
                  "URI": "21.0.0.11:6379/",
                  "database_name": 0,
                  "host": "21.0.0.11",
                  "port": "6379"
                },

                {
                  "engine": "mongo",
                  "name": "2hours",
                  "URI": "192.168.67.13:27018/",
                  "database_name": "twitter_2hours",
                  "collection": "coll",
                  "time": 120
                },

                {
                  "engine": "mongo",
                  "name": "4hours", 
                  "URI": "192.168.67.13:27019/",
                  "database_name": "twitter_4hours",
                  "collection": "coll",
                  "time": 240
                },

                {
                  "engine": "mongo",
                  "name": "6hours",
                  "URI": "192.168.67.13:27020/",
                  "database_name": "twitter_6hours",
                  "collection": "coll",
                  "time": 360
                }
            ]

topics = [
            { "topics": ["Oracle Database"],
              "name": "OracleDatabase",
              "keywords": ["oracle"] },

            { "topics": ["MySQL"],
              "name": "MySQL",
              "keywords": ["mysql"] },

            { "topics": ["SQL Server", "SQLServer"],
              "name": "SQLServer",
              "keywords": ["sql server", "sqlserver"] },

            { "topics": ["PostgreSQL", "Postgres"],
              "name": "PostgreSQL",
              "keywords": ["postgres"] },

            { "topics": ["MongoDB"],
              "name": "MongoDB",
              "keywords": ["mongo"] },

            { "topics": ["IBM DB2"],
              "name": "DB2",
              "keywords": ["ibm", "db2"] },

            { "topics": ["Microsoft Access"],
              "name": "Access",
              "keywords": ["microsoft access"] },

            { "topics": ["Elasticsearch"],
              "name": "Elasticsearch",
              "keywords": ["elasticsearch", "elastic"] },

            { "topics": ["SQLite"],
              "name": "SQLite",
              "keywords": ["sqlite"] }         
        ]

# Crear BD "System"
client = MongoClient('mongodb://' + MONGO_USER + ':' + MONGO_PASSWORD + '@' + 'mongo-system:27017/')
dbnames = client.list_database_names()

if 'settings' in dbnames:
  client.drop_database('settings')

settings = client['settings']

# Crear colección Databases
databases_coll = settings['databases']

# Crear colección topics
topics_coll = settings['topics']

databases_coll.insert_many(databases)
topics_coll.insert_many(topics, ordered=False)

twitter_2hours = client['twitter_2hours']['coll']
twitter_4hours = client['twitter_4hours']['coll']
twitter_6hours = client['twitter_6hours']['coll']

# Indexar BDs de tiempo
twitter_2hours.create_index("timestamp")
twitter_4hours.create_index("timestamp")
twitter_6hours.create_index("timestamp")

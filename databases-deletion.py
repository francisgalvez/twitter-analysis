from pymongo import MongoClient
import requests
import time

databases = requests.get(url = 'http://localhost:3000/api/tweets/databases').json()

db_2h = MongoClient(databases.twoHoursDb.URI)
db_4h = MongoClient(databases.fourHoursDb.URI)
db_6h = MongoClient(databases.sixHoursDb.URI)

actual_timestamp = time.time()
two_hours_edge = actual_timestamp - databases.twoHoursDb.time*60*1000
four_hours_edge = actual_timestamp - databases.fourHoursDb.time*60*1000
six_hours_edge = actual_timestamp - databases.sixHoursDb.time*60*1000

db_2h.delete_many({'timestamp': { $lte: actualTimestamp - two_hours_edge }})
db_4h.delete_many({'timestamp': { $lte: actualTimestamp - four_hours_edge }})
db_6h.delete_many({'timestamp': { $lte: actualTimestamp - six_hours_edge }})

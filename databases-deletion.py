import requests

databases = requests.get(url = 'http://192.168.67.11:3000/api/tweets/databases').json()

res1 = requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + databases['twoHoursDb']['database_name'])
res2 = requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + databases['fourHoursDb']['database_name'])
res3 = requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + databases['sixHoursDb']['database_name'])

print(res1)
print(res2)
print(res3)

"""
db_2h = MongoClient(databases.twoHoursDb.URI)[databases.twoHoursDb.database_name]
db_4h = MongoClient(databases.fourHoursDb.URI)[databases.fourHoursDb.database_name]
db_6h = MongoClient(databases.sixHoursDb.URI)[databases.sixHoursDb.database_name]

actual_timestamp = time.time()
two_hours_edge = actual_timestamp - databases.twoHoursDb.time*60*1000
four_hours_edge = actual_timestamp - databases.fourHoursDb.time*60*1000
six_hours_edge = actual_timestamp - databases.sixHoursDb.time*60*1000

db_2h.delete_many({'timestamp': { $lte: actualTimestamp - two_hours_edge }})
db_4h.delete_many({'timestamp': { $lte: actualTimestamp - four_hours_edge }})
db_6h.delete_many({'timestamp': { $lte: actualTimestamp - six_hours_edge }})
"""

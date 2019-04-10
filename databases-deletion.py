import requests

databases = requests.get(url = 'http://192.168.67.11:3000/api/tweets/databases').json()

for (k, v) in databases.items():
    requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + v['database_name'])

"""
requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + databases['twoHoursDb']['database_name'])
requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + databases['fourHoursDb']['database_name'])
requests.post(url = 'http://192.168.67.11:3000/api/tweets/delete/db/' + databases['sixHoursDb']['database_name'])
"""

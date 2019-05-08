import requests

databases = requests.get(url = 'http://whosbest-twitter-map.app.di.ual.es/api/tweets/databases').json()

for (k, v) in databases.items():
    requests.post(url = 'http://whosbest-twitter-map.app.di.ual.es/api/tweets/delete/db/' + v['database_name'])

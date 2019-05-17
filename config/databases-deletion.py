import requests
from secret import TOKEN

databases = requests.get(url = 'http://whosbest-twitter-map.app.di.ual.es/api/tweets/databases', headers={'Authorization': 'Bearer ' + TOKEN}).json()

for v in databases:
    if v['name']=='2hours' or v['name']=='4hours' or v['name']=='6hours':
        requests.post(url = 'http://whosbest-twitter-map.app.di.ual.es/api/tweets/delete/db/' + v['name'], headers={'Authorization': 'Bearer ' + TOKEN})

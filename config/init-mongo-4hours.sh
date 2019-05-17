mongo -- "twitter_4hours" <<EOF
var user = '$MONGO_INITDB_ROOT_USERNAME';
var passwd = '$MONGO_INITDB_ROOT_PASSWORD';
var twitter_4hours = db.getSiblingDB('twitter_4hours');
twitter_4hours.auth(user, passwd);
db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
EOF

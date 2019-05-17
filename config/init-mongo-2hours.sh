mongo -- "twitter_2hours" <<EOF
var user = '$MONGO_INITDB_ROOT_USERNAME';
var passwd = '$MONGO_INITDB_ROOT_PASSWORD';
var twitter_2hours = db.getSiblingDB('twitter_2hours');
twitter_2hours.auth(user, passwd);
db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
EOF

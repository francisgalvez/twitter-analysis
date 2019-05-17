mongo -- "twitter_6hours" <<EOF
var user = '$MONGO_INITDB_ROOT_USERNAME';
var passwd = '$MONGO_INITDB_ROOT_PASSWORD';
var twitter_6hours = db.getSiblingDB('twitter_6hours');
twitter_6hours.auth(user, passwd);
db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
EOF

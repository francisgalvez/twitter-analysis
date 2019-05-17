mongo -- "users" <<EOF
var user = '$MONGO_INITDB_ROOT_USERNAME';
var passwd = '$MONGO_INITDB_ROOT_PASSWORD';
var users = db.getSiblingDB('users');
users.auth(user, passwd);
db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
EOF


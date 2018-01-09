let username = 'admin'
let password = 'AsDf12!@-'
password = encodeURIComponent(password)
let url = 'mongodb://' + username + ':' + password + '@optimusprime-shard-00-00-yw6p6.mongodb.net:27017,optimusprime-shard-00-01-yw6p6.mongodb.net:27017,optimusprime-shard-00-02-yw6p6.mongodb.net:27017/test?ssl=true&replicaSet=OptimusPrime-shard-0&authSource=admin'

module.exports = {
  'secret':'nodeauthsecret',
  'database': url
  // 'database': 'mongodb://localhost/cwl'
};

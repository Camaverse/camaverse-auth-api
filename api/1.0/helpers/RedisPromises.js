const { promisify } = require("util");
const redis = require("redis");

const redisHost = process.env.REDIS_URL;
const redisPort = process.env.REDIS_PORT;
const redisAuth = process.env.REDIS_AUTH;

var client = redis.createClient ({
    port : redisPort,
    host : redisHost
});

if(redisAuth) {
    client.auth(redisAuth, function (err, response) {
        if (err) {
            throw err;
        }
    });
}

client.on("error", function(err) {
    throw err;
});

const rGet = promisify(client.get).bind(client);
const rSet = promisify(client.set).bind(client);

module.exports =  {
    rGet,
    rSet
}
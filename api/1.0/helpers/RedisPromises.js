const { promisify } = require("util");
const redis = require("redis");
const client = redis.createClient();
client.on("error", function(error) {
    console.error(error);
});

const rGet = promisify(client.get).bind(client);
const rSet = promisify(client.set).bind(client);

module.exports =  {
    rGet,
    rSet
}
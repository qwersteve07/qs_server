const { createClient } = require("redis");

class RedisService {
  _client;
  async init() {
    this.client = createClient({
      username: "default", // use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
      password: "QrBgdY8MEEa50q4BYNIRyurd2u6vQIKx", // use your password here
      socket: {
        host: "redis-16926.c302.asia-northeast1-1.gce.redns.redis-cloud.com",
        port: 16926,
        // tls: true,
        // key: readFileSync('./redis_user_private.key'),
        // cert: readFileSync('./redis_user.crt'),
        // ca: [readFileSync('./redis_ca.pem')]
      },
    });

    this.client.on("error", (error) => {
      console.log(`Redis client error : ${error} `);
    });

    await this.client.connect();
  }

  async setData(key, value) {
    await this.client.set(key, value, { NX: true });
  }

  async getData(key) {
    return await this.client.get(key);
  }
}

module.exports = new RedisService();

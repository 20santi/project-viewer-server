import Redis from "ioredis";

export const redisClient = new Redis(
  "redis://default:3408efaf955a4725a6ea84bba158553a@us1-shining-treefrog-40912.upstash.io:40912"
);
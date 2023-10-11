"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../clients/db");
const redis_1 = require("../clients/redis");
class TweetService {
    static createTweet(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const rateLimitFlag = yield redis_1.redisClient.get(`rate_limit:tweet:${data.userId}`);
            if (rateLimitFlag) {
                throw new Error("You are spaming. Please wait....");
            }
            const tweet = yield db_1.prismaClient.tweet.create({
                data: {
                    content: data.content,
                    imageURL: data.imageURL,
                    author: { connect: { id: data.userId } },
                },
                include: {
                    author: true, // Include the author's details in the response
                },
            });
            yield redis_1.redisClient.setex(`rate_limit:tweet:${data.userId}`, 10, 1);
            yield redis_1.redisClient.del("all_tweets");
            return tweet;
        });
    }
    static getAllTweets() {
        return __awaiter(this, void 0, void 0, function* () {
            const cashedTweets = yield redis_1.redisClient.get("all_tweets");
            if (cashedTweets) {
                return JSON.parse(cashedTweets);
            }
            const tweets = yield db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
            yield redis_1.redisClient.set("all_tweets", JSON.stringify(tweets));
            return tweets;
        });
    }
}
exports.default = TweetService;

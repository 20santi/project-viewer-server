import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayload {
    content: string;
    imageURL: string;
    userId: string;
  }

class TweetService {
    public static async createTweet(data: CreateTweetPayload) {
        const rateLimitFlag = await redisClient.get(
            `rate_limit:tweet:${data.userId}`
        );
        if(rateLimitFlag) {
            throw new Error("You are spaming. Please wait....");
        }
        const tweet = await prismaClient.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: { connect: { id: data.userId }},
            },
            include: {
                author: true, // Include the author's details in the response
            },
        });
        await redisClient.setex( `rate_limit:tweet:${data.userId}`, 10, 1);
        await redisClient.del("all_tweets");
        return tweet;
    }

    public static async getAllTweets() {
        const cashedTweets = await redisClient.get("all_tweets");
        if(cashedTweets) {
            return JSON.parse(cashedTweets);
        }

        const tweets = await prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
        await redisClient.set("all_tweets", JSON.stringify(tweets));
        return tweets;
    }
}

export default TweetService;
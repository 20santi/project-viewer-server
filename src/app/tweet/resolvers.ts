import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";

interface CreateTweetPayload {
  content: string;
  imageURL: string;
}

const queries = {
  getAllTweets: () => prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" }}),
}

const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not logged in user");
    console.log("ID: ", ctx.user.id);
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        imageURL: payload.imageURL,
        author: { connect: { id: ctx.user.id } },
      },
      include: {
        author: true, // Include the author's details in the response
      },
    });

    return tweet;
  },
};

const fetchUserDetails = {
    Tweet: {
        author: (parent: Tweet) => 
            prismaClient.user.findUnique({ where: { id: parent.authorId }}),
    }
}

export const resolvers = { mutations, fetchUserDetails, queries };

import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserService.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) {
      return "ID not found";
    }

    const user = await UserService.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => UserService.getUserById(id),
};

const extraResolvers = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),

    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      return result.map((ele) => ele.follower);
    },

    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      return result.map((ele) => ele.following);
    },

    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
      const cashedValue = await redisClient.get(`RECOMENDED_USERS:${ctx.user.id}`);

      if(cashedValue) {
        return JSON.parse(cashedValue);
      }

      const myFollowing = await prismaClient.follows.findMany({
        where: {
          follower: { id: ctx.user.id },
        },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });

      const users: User[] = [];

      for (const followings of myFollowing) {
        for (const followingOfFollowUser of followings.following.followers) {
          if (
            followingOfFollowUser.following.id !== ctx.user.id &&
            myFollowing.findIndex(
              (e) => e.followingId === followingOfFollowUser.following.id
            ) < 0
          ) {
            users.push(followingOfFollowUser.following);
          }
        }
      }
      
      await redisClient.set(`RECOMENDED_USERS:${ctx.user.id}`, JSON.stringify(users));

      return users;
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated User");
    await UserService.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMENDED_USERS:${ctx.user.id}`);
    return true;
  },

  unFollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated User");
    await UserService.unFollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMENDED_USERS:${ctx.user.id}`);
    return true;
  },
};

export const resolvers = { queries, extraResolvers, mutations };

//Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsbXoxcjQ0NzAwMDB2YmhzZzhxMjRncHIiLCJlbWFpbCI6InNhbnRpc2luZ2hhMTkxQGdtYWlsLmNvbSIsImlhdCI6MTY5NTcyMjgwOH0.wOREFow5skrEilmybqGNZA94uv5K5LqhBcuLcZv8O5A

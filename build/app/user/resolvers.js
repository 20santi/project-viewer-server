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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const user_1 = __importDefault(require("../../services/user"));
const queries = {
    verifyGoogleToken: (parent, { token }) => __awaiter(void 0, void 0, void 0, function* () {
        const resultToken = yield user_1.default.verifyGoogleAuthToken(token);
        return resultToken;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        console.log("ctx:------------ ", ctx);
        const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id) {
            return "ID not found";
        }
        const user = yield user_1.default.getUserById(id);
        return user;
    }),
    getUserById: (parent, { id }, ctx) => __awaiter(void 0, void 0, void 0, function* () { return user_1.default.getUserById(id); }),
};
const extraResolvers = {
    User: {
        tweets: (parent) => db_1.prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { following: { id: parent.id } },
                include: {
                    follower: true,
                }
            });
            return result.map((ele) => ele.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { follower: { id: parent.id } },
                include: {
                    following: true,
                },
            });
            return result.map((ele) => ele.following);
        }),
    },
};
const mutations = {
    followUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("CTX: ", ctx.user);
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated User");
        yield user_1.default.followUser(ctx.user.id, to);
        return true;
    }),
    unFollowUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated User");
        yield user_1.default.unFollowUser(ctx.user.id, to);
        return true;
    }),
};
exports.resolvers = { queries, extraResolvers, mutations };
//Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsbXoxcjQ0NzAwMDB2YmhzZzhxMjRncHIiLCJlbWFpbCI6InNhbnRpc2luZ2hhMTkxQGdtYWlsLmNvbSIsImlhdCI6MTY5NTcyMjgwOH0.wOREFow5skrEilmybqGNZA94uv5K5LqhBcuLcZv8O5A

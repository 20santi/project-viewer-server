"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const types_1 = require("./types");
const queries_1 = require("./queries");
const resolvers_1 = require("./resolvers");
const mutation_1 = require("./mutation");
exports.Tweet = { types: types_1.types, mutations: mutation_1.mutations, resolvers: resolvers_1.resolvers, queries: queries_1.queries };

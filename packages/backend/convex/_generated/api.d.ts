/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as env from "../env.js";
import type * as functions_admin from "../functions/admin.js";
import type * as functions_auth from "../functions/auth.js";
import type * as functions_exercises from "../functions/exercises.js";
import type * as functions_openai from "../functions/openai.js";
import type * as utils from "../utils.js";
import type * as validators_validators from "../validators/validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  env: typeof env;
  "functions/admin": typeof functions_admin;
  "functions/auth": typeof functions_auth;
  "functions/exercises": typeof functions_exercises;
  "functions/openai": typeof functions_openai;
  utils: typeof utils;
  "validators/validators": typeof validators_validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

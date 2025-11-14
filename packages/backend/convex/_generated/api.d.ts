/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_auth from "../functions/auth.js";
import type * as functions_exerciseVariants from "../functions/exerciseVariants.js";
import type * as functions_exercises from "../functions/exercises.js";
import type * as functions_openai from "../functions/openai.js";
import type * as functions_submissions from "../functions/submissions.js";
import type * as utils from "../utils.js";
import type * as validators_validators from "../validators/validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "functions/auth": typeof functions_auth;
  "functions/exerciseVariants": typeof functions_exerciseVariants;
  "functions/exercises": typeof functions_exercises;
  "functions/openai": typeof functions_openai;
  "functions/submissions": typeof functions_submissions;
  utils: typeof utils;
  "validators/validators": typeof validators_validators;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};

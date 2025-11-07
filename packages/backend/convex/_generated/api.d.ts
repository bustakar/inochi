/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_migrations from "../functions/migrations.js";
import type * as functions_openai from "../functions/openai.js";
import type * as functions_skills from "../functions/skills.js";
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
  "functions/migrations": typeof functions_migrations;
  "functions/openai": typeof functions_openai;
  "functions/skills": typeof functions_skills;
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

// Learn more https://docs.expo.dev/guides/monorepos

const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// #1 - Watch all files in the monorepo (merge with defaults)
const defaultWatchFolders = config.watchFolders || [];
config.watchFolders = [...defaultWatchFolders, workspaceRoot];
// #3 - Force resolving nested modules to the folders below
// Note: This is required for monorepo setup, but expo-doctor warns about it
// Keeping it as it's necessary for proper module resolution in monorepo
config.resolver.disableHierarchicalLookup = true;
// #2 - Try resolving with project modules first, then workspace modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, "node_modules", ".cache", "metro"),
  }),
];

module.exports = config;

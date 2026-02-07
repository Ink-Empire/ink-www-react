const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const sharedDir = path.resolve(__dirname, '../shared');
const rnNodeModules = path.resolve(__dirname, 'node_modules');

const config = {
  watchFolders: [sharedDir],
  resolver: {
    nodeModulesPaths: [rnNodeModules],
    // Block shared/node_modules so React resolves from RN's copy only
    blockList: [new RegExp(path.resolve(sharedDir, 'node_modules').replace(/[/\\]/g, '[/\\\\]'))],
    // Force single copies of these packages
    extraNodeModules: {
      react: path.resolve(rnNodeModules, 'react'),
      'react-native': path.resolve(rnNodeModules, 'react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

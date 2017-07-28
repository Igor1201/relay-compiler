/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule GraphQLFileParser
 * 
 * @format
 */

'use strict';

function parseFile(baseDir, file) {
  var text = require('fs').readFileSync(require('path').join(baseDir, file.relPath), 'utf8');
  var moduleName = require('path').basename(file.relPath, '.graphql');

  var ast = void 0;
  try {
    ast = require('graphql').parse(new (require('graphql').Source)(text, moduleName));
  } catch (e) {
    throw new Error('GraphQLFileParser: ' + e);
  }

  return ast;
}

function getParser(baseDir) {
  return new (require('./FileParser'))({
    baseDir: baseDir,
    parse: parseFile
  });
}

module.exports = {
  getParser: getParser
};
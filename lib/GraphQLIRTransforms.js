/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule GraphQLIRTransforms
 * 
 * @format
 */

'use strict';

// Transforms applied to the code used to process a query response.
var schemaExtensions = [require('./RelayFlattenTransform').SCHEMA_EXTENSION];

// Transforms applied to fragments used for reading data from a store
var FRAGMENT_TRANSFORMS = [function (ctx) {
  return require('./RelayFlattenTransform').transform(ctx, {
    flattenAbstractTypes: true
  });
}, require('./SkipRedundantNodesTransform').transform];

// Transforms applied to queries/mutations/subscriptions that are used for
// fetching data from the server and parsing those responses.
var QUERY_TRANSFORMS = [require('./SkipClientFieldTransform').transform, require('./SkipUnreachableNodeTransform').transform];

// Transforms applied to the code used to process a query response.
var CODEGEN_TRANSFORMS = [function (ctx) {
  return require('./RelayFlattenTransform').transform(ctx, {
    flattenAbstractTypes: true,
    flattenFragmentSpreads: true
  });
}, require('./SkipRedundantNodesTransform').transform, require('./FilterDirectivesTransform').transform];

module.exports = {
  codegenTransforms: CODEGEN_TRANSFORMS,
  fragmentTransforms: FRAGMENT_TRANSFORMS,
  queryTransforms: QUERY_TRANSFORMS,
  schemaExtensions: schemaExtensions
};
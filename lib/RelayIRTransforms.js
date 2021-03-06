/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayIRTransforms
 * 
 * @format
 */

'use strict';

var _toConsumableArray3 = _interopRequireDefault(require('babel-runtime/helpers/toConsumableArray'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var codegenTransforms = require('./GraphQLIRTransforms').codegenTransforms,
    fragmentTransforms = require('./GraphQLIRTransforms').fragmentTransforms,
    queryTransforms = require('./GraphQLIRTransforms').queryTransforms,
    schemaExtensions = require('./GraphQLIRTransforms').schemaExtensions;

// Transforms applied to the code used to process a query response.


var relaySchemaExtensions = [require('./RelayConnectionTransform').SCHEMA_EXTENSION, require('./RelayRelayDirectiveTransform').SCHEMA_EXTENSION].concat((0, _toConsumableArray3['default'])(schemaExtensions));

// Transforms applied to fragments used for reading data from a store
var relayFragmentTransforms = [function (ctx) {
  return require('./RelayConnectionTransform').transform(ctx);
}, require('./RelayViewerHandleTransform').transform, require('./RelayRelayDirectiveTransform').transform, require('./RelayFieldHandleTransform').transform].concat((0, _toConsumableArray3['default'])(fragmentTransforms));

// Transforms applied to queries/mutations/subscriptions that are used for
// fetching data from the server and parsing those responses.
var relayQueryTransforms = [function (ctx) {
  return require('./RelayConnectionTransform').transform(ctx, {
    generateRequisiteFields: true
  });
}, require('./RelayViewerHandleTransform').transform, require('./RelayApplyFragmentArgumentTransform').transform].concat((0, _toConsumableArray3['default'])(queryTransforms), [require('./RelayRelayDirectiveTransform').transform, require('./RelayGenerateRequisiteFieldsTransform').transform]);

// Transforms applied to the code used to process a query response.
var relayCodegenTransforms = codegenTransforms;

// Transforms applied before printing the query sent to the server.
var relayPrintTransforms = [function (ctx) {
  return require('./RelayFlattenTransform').transform(ctx, {});
}, require('./RelaySkipHandleFieldTransform').transform, require('./FilterDirectivesTransform').transform];

module.exports = {
  codegenTransforms: relayCodegenTransforms,
  fragmentTransforms: relayFragmentTransforms,
  printTransforms: relayPrintTransforms,
  queryTransforms: relayQueryTransforms,
  schemaExtensions: relaySchemaExtensions
};
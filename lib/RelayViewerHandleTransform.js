/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @providesModule RelayViewerHandleTransform
 * @format
 */

'use strict';

var _extends3 = _interopRequireDefault(require('babel-runtime/helpers/extends'));

var _toConsumableArray3 = _interopRequireDefault(require('babel-runtime/helpers/toConsumableArray'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _require = require('./RelayDefaultHandleKey'),
    DEFAULT_HANDLE_KEY = _require.DEFAULT_HANDLE_KEY;

var _require2 = require('./RelaySchemaUtils'),
    getRawType = _require2.getRawType;

var _require3 = require('graphql'),
    GraphQLObjectType = _require3.GraphQLObjectType;

var ID = 'id';
var VIEWER_HANDLE = 'viewer';
var VIEWER_TYPE = 'Viewer';

/**
 * A transform that adds a "viewer" handle to all fields whose type is `Viewer`.
 */
function transform(context, schema) {
  var viewerType = schema.getType(VIEWER_TYPE);
  if (viewerType == null || !(viewerType instanceof GraphQLObjectType) || viewerType.getFields()[ID] != null) {
    return context;
  }
  return require('./RelayIRTransformer').transform(context, {
    LinkedField: visitLinkedField
  }, function () {
    return {};
  });
}

function visitLinkedField(field, state) {
  var transformedNode = this.traverse(field, state);
  if (getRawType(field.type).name !== VIEWER_TYPE) {
    return transformedNode;
  }
  var handles = transformedNode.handles;
  var viewerHandle = {
    name: VIEWER_HANDLE,
    key: DEFAULT_HANDLE_KEY,
    filters: null
  };

  if (handles && !handles.find(function (handle) {
    return handle.name === VIEWER_HANDLE;
  })) {
    handles = [].concat((0, _toConsumableArray3['default'])(handles), [viewerHandle]);
  } else if (!handles) {
    handles = [viewerHandle];
  }
  return handles !== transformedNode.handles ? (0, _extends3['default'])({}, transformedNode, { handles: handles }) : transformedNode;
}

module.exports = { transform: transform };
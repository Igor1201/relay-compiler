/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ASTConvert
 * 
 * @format
 */

'use strict';

var _toConsumableArray3 = _interopRequireDefault(require('babel-runtime/helpers/toConsumableArray'));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _require = require('./RelaySchemaUtils'),
    isOperationDefinitionAST = _require.isOperationDefinitionAST,
    isSchemaDefinitionAST = _require.isSchemaDefinitionAST;

var _require2 = require('graphql'),
    extendSchema = _require2.extendSchema,
    parse = _require2.parse,
    visit = _require2.visit;

function convertASTDocuments(schema, documents, validationRules) {
  var definitions = definitionsFromDocuments(documents);

  var astDefinitions = [];
  documents.forEach(function (doc) {
    doc.definitions.forEach(function (definition) {
      if (isOperationDefinitionAST(definition)) {
        astDefinitions.push(definition);
      }
    });
  });

  return convertASTDefinitions(schema, definitions, validationRules);
}

function convertASTDocumentsWithBase(schema, baseDocuments, documents, validationRules) {
  var baseDefinitions = definitionsFromDocuments(baseDocuments);
  var definitions = definitionsFromDocuments(documents);

  var requiredDefinitions = new Map();
  var baseMap = new Map();
  baseDefinitions.forEach(function (definition) {
    if (isOperationDefinitionAST(definition)) {
      if (definition.name) {
        // If there's no name, no reason to put in the map
        baseMap.set(definition.name.value, definition);
      }
    }
  });

  var definitionsToVisit = [];
  definitions.forEach(function (definition) {
    if (isOperationDefinitionAST(definition)) {
      definitionsToVisit.push(definition);
    }
  });
  while (definitionsToVisit.length > 0) {
    var definition = definitionsToVisit.pop();
    var name = definition.name;
    if (!name || requiredDefinitions.has(name.value)) {
      continue;
    }
    requiredDefinitions.set(name.value, definition);
    visit(definition, {
      FragmentSpread: function FragmentSpread(spread) {
        var baseDefinition = baseMap.get(spread.name.value);
        if (baseDefinition) {
          // We only need to add those definitions not already included
          // in definitions
          definitionsToVisit.push(baseDefinition);
        }
      }
    });
  }

  var definitionsToConvert = [];
  requiredDefinitions.forEach(function (definition) {
    return definitionsToConvert.push(definition);
  });
  return convertASTDefinitions(schema, definitionsToConvert, validationRules);
}

function convertASTDefinitions(schema, definitions, validationRules) {
  var operationDefinitions = [];
  definitions.forEach(function (definition) {
    if (isOperationDefinitionAST(definition)) {
      operationDefinitions.push(definition);
    }
  });

  var validationAST = {
    kind: 'Document',
    // DocumentNode doesn't accept that a node of type
    // FragmentDefinitionNode | OperationDefinitionNode is a DefinitionNode
    definitions: operationDefinitions
  };
  // Will throw an error if there are validation issues
  require('./GraphQLValidator').validate(validationAST, schema, validationRules);
  return operationDefinitions.map(function (definition) {
    return require('./RelayParser').transform(schema, definition);
  });
}

function definitionsFromDocuments(documents) {
  var definitions = [];
  documents.forEach(function (doc) {
    doc.definitions.forEach(function (definition) {
      return definitions.push(definition);
    });
  });
  return definitions;
}

function transformASTSchema(schema, schemaExtensions) {
  return schemaExtensions.length > 0 ? extendSchema(schema, parse(schemaExtensions.join('\n'))) : schema;
}

function extendASTSchema(baseSchema, documents) {
  // Should be TypeSystemDefinitionNode
  var schemaExtensions = [];
  documents.forEach(function (doc) {
    // TODO: isSchemaDefinitionAST should %checks, once %checks is available
    schemaExtensions.push.apply(schemaExtensions, (0, _toConsumableArray3['default'])(doc.definitions.filter(isSchemaDefinitionAST)));
  });

  if (schemaExtensions.length <= 0) {
    return baseSchema;
  }

  return extendSchema(baseSchema, {
    kind: 'Document',
    // Flow doesn't recognize that TypeSystemDefinitionNode is a subset of
    // DefinitionNode
    definitions: schemaExtensions
  });
}

module.exports = {
  convertASTDocuments: convertASTDocuments,
  convertASTDocumentsWithBase: convertASTDocumentsWithBase,
  extendASTSchema: extendASTSchema,
  transformASTSchema: transformASTSchema
};
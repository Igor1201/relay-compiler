/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayCodegenWatcher
 * 
 * @format
 */
'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _toConsumableArray3 = _interopRequireDefault(require('babel-runtime/helpers/toConsumableArray'));

let queryFilesWithWatchman = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* (client, filterOptions, filter) {
    var baseDir = filterOptions.baseDir;

    var _ref = yield Promise.all([client.watchProject(baseDir), getFields(client)]),
        watchResp = _ref[0],
        fields = _ref[1];

    var resp = yield client.command('query', watchResp.root, {
      expression: buildWatchExpression(filterOptions),
      fields: fields,
      relative_root: watchResp.relativePath
    });
    client.end();
    return updateFiles(new Set(), baseDir, filter, resp.files);
  });

  return function queryFilesWithWatchman(_x, _x2, _x3) {
    return _ref3.apply(this, arguments);
  };
})();

let queryFilesWithGlob = (() => {
  var _ref4 = (0, _asyncToGenerator3.default)(function* (filterOptions, filter) {
    var baseDir = filterOptions.baseDir,
        include = filterOptions.include,
        extensions = filterOptions.extensions,
        exclude = filterOptions.exclude;

    var patterns = include.map(function (inc) {
      return inc + '/*.+(' + extensions.join('|') + ')';
    });

    var files = yield require('fast-glob')(patterns, {
      cwd: baseDir,
      bashNative: [],
      onlyFiles: true,
      ignore: exclude,
      transform: function transform(name) {
        return { name: name, exists: true };
      }
    });
    return updateFiles(new Set(), baseDir, filter, files);
  });

  return function queryFilesWithGlob(_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
})();

let queryFiles = (() => {
  var _ref5 = (0, _asyncToGenerator3.default)(function* (filterOptions, filter) {
    var client = filterOptions.watchman && (yield require('./RelayWatchmanClient').createIfAvailable());

    if (client) {
      return queryFilesWithWatchman(client, filterOptions, filter);
    } else {
      return queryFilesWithGlob(filterOptions, filter);
    }
  });

  return function queryFiles(_x6, _x7) {
    return _ref5.apply(this, arguments);
  };
})();

let getFields = (() => {
  var _ref6 = (0, _asyncToGenerator3.default)(function* (client) {
    var fields = ['name', 'exists'];
    if (yield client.hasCapability('field-content.sha1hex')) {
      fields.push('content.sha1hex');
    }
    return fields;
  });

  return function getFields(_x8) {
    return _ref6.apply(this, arguments);
  };
})();

/**
 * Provides a simplified API to the watchman API.
 * Given some base directory and a list of subdirectories it calls the callback
 * with watchman change events on file changes.
 */


let watch = (() => {
  var _ref7 = (0, _asyncToGenerator3.default)(function* (filterOptions, callback) {
    var client = new (require('./RelayWatchmanClient'))();
    var watchResp = yield client.watchProject(filterOptions.baseDir);

    yield makeSubscription(client, watchResp.root, watchResp.relativePath, filterOptions, callback);
  });

  return function watch(_x9, _x10) {
    return _ref7.apply(this, arguments);
  };
})();

let makeSubscription = (() => {
  var _ref8 = (0, _asyncToGenerator3.default)(function* (client, root, relativePath, filterOptions, callback) {
    client.on('subscription', function (resp) {
      if (resp.subscription === SUBSCRIPTION_NAME) {
        callback(resp);
      }
    });
    var fields = yield getFields(client);
    yield client.command('subscribe', root, SUBSCRIPTION_NAME, {
      expression: buildWatchExpression(filterOptions),
      fields: fields,
      relative_root: relativePath
    });
  });

  return function makeSubscription(_x11, _x12, _x13, _x14, _x15) {
    return _ref8.apply(this, arguments);
  };
})();

/**
 * Further simplifies `watch` and calls the callback on every change with a
 * full list of files that match the conditions.
 */


let watchFiles = (() => {
  var _ref9 = (0, _asyncToGenerator3.default)(function* (filterOptions, filter, callback) {
    var files = new Set();
    yield watch(filterOptions, function (changes) {
      if (!changes.files) {
        // Watchmen fires a change without files when a watchman state changes,
        // for example during an hg update.
        return;
      }
      files = updateFiles(files, filterOptions.baseDir, filter, changes.files);
      callback(files);
    });
  });

  return function watchFiles(_x16, _x17, _x18) {
    return _ref9.apply(this, arguments);
  };
})();

/**
 * Similar to watchFiles, but takes an async function. The `compile` function
 * is awaited and not called in parallel. If multiple changes are triggered
 * before a compile finishes, the latest version is called after the compile
 * finished.
 *
 * TODO: Consider changing from a Promise to abortable, so we can abort mid
 *       compilation.
 */


let watchCompile = (() => {
  var _ref10 = (0, _asyncToGenerator3.default)(function* (filterOptions, filter, compile) {
    var compiling = false;
    var needsCompiling = false;
    var latestFiles = null;

    watchFiles(filterOptions, filter, (() => {
      var _ref11 = (0, _asyncToGenerator3.default)(function* (files) {
        needsCompiling = true;
        latestFiles = files;
        if (compiling) {
          return;
        }
        compiling = true;
        while (needsCompiling) {
          needsCompiling = false;
          yield compile(latestFiles);
        }
        compiling = false;
      });

      return function (_x22) {
        return _ref11.apply(this, arguments);
      };
    })());
  });

  return function watchCompile(_x19, _x20, _x21) {
    return _ref10.apply(this, arguments);
  };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var SUBSCRIPTION_NAME = 'relay-codegen';

function buildWatchExpression(options) {
  return ['allof', ['type', 'f'], ['anyof'].concat((0, _toConsumableArray3['default'])(options.extensions.map(function (ext) {
    return ['suffix', ext];
  }))), ['anyof'].concat((0, _toConsumableArray3['default'])(options.include.map(function (include) {
    return ['match', include, 'wholename'];
  })))].concat((0, _toConsumableArray3['default'])(options.exclude.map(function (exclude) {
    return ['not', ['match', exclude, 'wholename']];
  })));
}

function updateFiles(files, baseDir, filter, fileChanges) {
  var fileMap = new Map();
  files.forEach(function (file) {
    fileMap.set(file.relPath, file);
  });

  fileChanges.forEach(function (_ref2) {
    var name = _ref2.name,
        exists = _ref2.exists,
        hash = _ref2['content.sha1hex'];

    var file = {
      relPath: name,
      hash: hash || hashFile(require('path').join(baseDir, name))
    };
    if (exists && filter(file)) {
      fileMap.set(name, file);
    } else {
      fileMap['delete'](name);
    }
  });
  return new Set(fileMap.values());
}

function hashFile(filename) {
  var content = require('fs').readFileSync(filename);
  return require('crypto').createHash('sha1').update(content).digest('hex');
}

module.exports = {
  buildWatchExpression: buildWatchExpression,
  queryFiles: queryFiles,
  watch: watch,
  watchFiles: watchFiles,
  watchCompile: watchCompile
};
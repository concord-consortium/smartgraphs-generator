var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';

        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';

        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }

        var n = loadNodeModulesSync(x, y);
        if (n) return n;

        throw new Error("Cannot find module '" + x + "'");

        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }

            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }

        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }

            return loadAsFileSync(x + '/index');
        }

        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }

            var m = loadAsFileSync(x);
            if (m) return m;
        }

        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');

            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }

            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);

    var keys = Object_keys(require.modules);

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;

    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };

    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/output/output-document.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var OutputActivity, OutputDocument, OutputPage, OutputStep;
  OutputActivity = require('./output-activity').OutputActivity;
  OutputPage = require('./output-page').OutputPage;
  OutputStep = require('./output-step').OutputStep;
  exports.OutputDocument = OutputDocument = (function() {
    function OutputDocument() {
      this.hash = {
        _id: "marias-run-generated-target.df6",
        _rev: 1,
        data_format_version: 6,
        activity: null,
        pages: [],
        steps: [],
        responseTemplates: [],
        axes: [],
        datadefs: [],
        tags: [],
        annotations: [],
        variables: [],
        units: []
      };
    }
    OutputDocument.prototype.createActivity = function(hash) {
      var activity;
      activity = new OutputActivity(this, hash);
      this.hash.activity = activity.hash;
      return activity;
    };
    OutputDocument.prototype.createPage = function(hash) {
      var page;
      page = new OutputPage(this, hash);
      this.hash.pages.push(page.hash);
      return page;
    };
    OutputDocument.prototype.createStep = function(index, hash) {
      var step;
      step = new OutputStep(this, index, hash);
      this.hash.steps.push(step.hash);
      return step;
    };
    return OutputDocument;
  })();
}).call(this);

});

require.define("/output/output-activity.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  /*
    Output "Activity" object.
  
    This class knows how to construct a itself from an input.Activity object. It maintains a set of child objects that
    represent something close to the output "Smartgraphs runtime JSON" format and has a toHash method to generate that
    format. (However, this class will likely maintain model objects that aren't explicitly represented in the final
    output hash or in the Smartgraphs runtime; for example, having an output.Graph class makes sense, even though the
    output hash is 'denormalized' and doesn't have an explicit representation of a Graph)
  
    Mostly, this class and the classes of its contained child objects implement builder methods that the input.* objects
    know how to call.
  */
  var OutputActivity, slugify;
  slugify = require('../slugify').slugify;
  exports.OutputActivity = OutputActivity = (function() {
    function OutputActivity(doc, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.url = "/" + hash.owner + "/" + (slugify(hash.title));
      hash.pages = [];
    }
    OutputActivity.prototype.url = function() {
      return this.hash.url;
    };
    OutputActivity.prototype.appendPage = function(props) {
      var outputPage;
      props.activity = this;
      props.index = this.hash.pages.length + 1;
      outputPage = this.doc.createPage(props);
      this.hash.pages.push(outputPage.url());
      return outputPage;
    };
    return OutputActivity;
  })();
}).call(this);

});

require.define("/slugify.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  exports.slugify = function(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/-/gi, "_");
    text = text.replace(/\s/gi, "-");
    return text.toLowerCase();
  };
}).call(this);

});

require.define("/output/output-page.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var OutputPage, slugify;
  slugify = require('../slugify').slugify;
  exports.OutputPage = OutputPage = (function() {
    function OutputPage(doc, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.activity = hash.activity.url();
      hash.steps = [];
      hash.url = "" + hash.activity + "/page/" + hash.index + "-" + (slugify(hash.name));
    }
    OutputPage.prototype.url = function() {
      return this.hash.url;
    };
    OutputPage.prototype.appendStep = function(props) {
      var index, step;
      props.activityPage = this;
      index = this.hash.steps.length + 1;
      step = this.doc.createStep(index, props);
      this.hash.steps.push(step.url());
      if (index === 1) {
        this.hash.firstStep = step.url();
      }
      return step;
    };
    return OutputPage;
  })();
}).call(this);

});

require.define("/output/output-step.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var OutputStep;
  exports.OutputStep = OutputStep = (function() {
    function OutputStep(doc, index, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.activityPage = hash.activityPage.url();
      hash.url = "" + hash.activityPage + "/step/1";
    }
    OutputStep.prototype.url = function() {
      return this.hash.url;
    };
    OutputStep.prototype.appendPane = function(props) {
      if (!this.hash.panes) {
        return this.hash.panes = {
          single: props
        };
      } else {
        throw "Multiple panes are not handled yet";
      }
    };
    OutputStep.prototype.addTool = function(name, options) {};
    return OutputStep;
  })();
}).call(this);

});

require.define("/converter.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var OutputDocument;
  OutputDocument = require('./output/output-document').OutputDocument;
  exports.convert = function(input) {
    var outputActivity, outputDocument, outputPage, outputStep, page, pane, _i, _j, _len, _len2, _ref, _ref2;
    outputDocument = new OutputDocument;
    outputActivity = outputDocument.createActivity({
      title: input.name,
      owner: input.owner || 'shared'
    });
    _ref = input.pages;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      page = _ref[_i];
      outputPage = outputActivity.appendPage({
        name: page.name,
        introText: page.text
      });
      outputStep = outputPage.appendStep({
        paneConfig: 'single',
        panes: null,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      });
      if (page.panes) {
        _ref2 = page.panes;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          pane = _ref2[_j];
          switch (pane.type) {
            case 'ImagePane':
              outputStep.appendPane({
                type: 'image',
                path: pane.url,
                caption: "" + pane.license + " " + pane.attribution
              });
          }
        }
      }
    }
    return outputDocument.hash;
  };
}).call(this);

});
require("/converter.js");

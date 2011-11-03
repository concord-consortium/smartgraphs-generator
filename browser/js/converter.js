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

require.define("/author/author-activity.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  /*
    "Activity" object in author forat.
  
    This class is built from an input hash (in the 'semantic JSON' format) and instantiates and manages child objects
    which represent the different model objects of the semantic JSON format.
  
    The various subtypes of pages will know how to call 'builder' methods on the runtime.* classes to insert elements as
    needed.
  
    For example, an author.sensorPage would have to know to call methods like RuntimeActivity.addGraph and
    RuntimeActivity.addDataset, as well as mehods such as, perhaps, RuntimeActivity.appendPage, RuntimePage.appendStep,
    and Step.addTool('sensor')
  
    The complexity of processing the input tree and deciding which builder methods on the runtime Page, runtime Step, etc
    to call mostly belong here. We expect there will be a largish and growing number of classes and subclasses in the
    author/ group, and that the runtime/ classes mostly just need to help keep the 'accounting' straight when the author/
    classes call builder methods on them.
  */
  var AuthorActivity, AuthorPage, AuthorUnit, RuntimeActivity;
  AuthorPage = require('./author-page').AuthorPage;
  AuthorUnit = require('./author-unit').AuthorUnit;
  RuntimeActivity = require('../runtime/runtime-activity').RuntimeActivity;
  exports.AuthorActivity = AuthorActivity = (function() {
    function AuthorActivity(hash) {
      var i, page, unit;
      this.hash = hash;
      if (this.hash.type !== 'Activity') {
        throw new Error("smartgraphs-generator: AuthorActivity constructor was called with a hash whose toplevel element does not have type: \"Activity\"");
      }
      this.name = hash.name, this.owner = hash.owner;
      this.owner || (this.owner = 'shared');
      this.pages = (function() {
        var _len, _ref, _results;
        _ref = hash.pages;
        _results = [];
        for (i = 0, _len = _ref.length; i < _len; i++) {
          page = _ref[i];
          _results.push(new AuthorPage(page, this, i + 1));
        }
        return _results;
      }).call(this);
      this.units = (function() {
        var _i, _len, _ref, _results;
        _ref = hash.units || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          unit = _ref[_i];
          _results.push(new AuthorUnit(unit, this));
        }
        return _results;
      }).call(this);
    }
    AuthorActivity.prototype.toRuntimeActivity = function() {
      var page, runtimeActivity, unit, _i, _j, _len, _len2, _ref, _ref2;
      runtimeActivity = new RuntimeActivity(this.owner, this.name);
      _ref = this.pages;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        page = _ref[_i];
        runtimeActivity.appendPage(page.toRuntimePage(runtimeActivity));
      }
      _ref2 = this.units;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        unit = _ref2[_j];
        runtimeActivity.defineUnit(unit.toRuntimeUnit(runtimeActivity));
      }
      return runtimeActivity;
    };
    return AuthorActivity;
  })();
}).call(this);

});

require.define("/author/author-page.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPage, dumbSingularize;
  dumbSingularize = require('../singularize').dumbSingularize;
  exports.AuthorPage = AuthorPage = (function() {
    function AuthorPage(hash, activity, index) {
      var _ref;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text, this.panes = _ref.panes;
    }
    AuthorPage.prototype.toRuntimePage = function(runtimeActivity) {
      var pane, runtimePage, step, type, _ref;
      runtimePage = runtimeActivity.createPage();
      runtimePage.setName(this.name);
      runtimePage.setText(this.text);
      step = runtimePage.appendStep();
      if (((_ref = this.panes) != null ? _ref.length : void 0) > 0) {
        if (this.panes.length > 1) {
          throw new Error("Only one pane is supported right now");
        }
        pane = this.panes[0];
        type = pane.type;
        switch (type) {
          case 'ImagePane':
            this.addImagePane(step, pane);
            break;
          case 'PredefinedGraphPane':
            this.addPredefinedGraphPane(step, pane, runtimeActivity);
            break;
          default:
            throw new Error("Only ImagePanes and PredefinedGraphPane are supported right now");
        }
      }
      return runtimePage;
    };
    AuthorPage.prototype.addImagePane = function(step, pane) {
      var attribution, license, url;
      url = pane.url, license = pane.license, attribution = pane.attribution;
      return step.addImagePane(url, license, attribution);
    };
    AuthorPage.prototype.addPredefinedGraphPane = function(step, pane, runtimeActivity) {
      var data, datadef, title, xAxis, xLabel, xMax, xMin, xTicks, xUnits, xUnitsRef, yAxis, yLabel, yMax, yMin, yTicks, yUnits, yUnitsRef;
      title = pane.title, data = pane.data, xLabel = pane.xLabel, xUnits = pane.xUnits, xMin = pane.xMin, xMax = pane.xMax, xTicks = pane.xTicks, yLabel = pane.yLabel, yUnits = pane.yUnits, yMin = pane.yMin, yMax = pane.yMax, yTicks = pane.yTicks;
      xUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(xUnits));
      yUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(yUnits));
      xAxis = runtimeActivity.createAndAppendAxis({
        label: xLabel,
        unitRef: xUnitsRef,
        min: xMin,
        max: xMax,
        nSteps: xTicks
      });
      yAxis = runtimeActivity.createAndAppendAxis({
        label: yLabel,
        unitRef: yUnitsRef,
        min: yMin,
        max: yMax,
        nSteps: yTicks
      });
      if (data != null) {
        datadef = runtimeActivity.createAndAppendDatadef({
          data: data,
          xLabel: xLabel,
          xUnitsRef: xUnitsRef,
          yLabel: yLabel,
          yUnitsRef: yUnitsRef
        });
      }
      return step.addGraphPane({
        title: title,
        datadef: datadef,
        xAxis: xAxis,
        yAxis: yAxis
      });
    };
    return AuthorPage;
  })();
}).call(this);

});

require.define("/singularize.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  exports.dumbSingularize = function(str) {
    var _ref;
    return ((_ref = str.match(/(.*)s$/)) != null ? _ref[1] : void 0) || str;
  };
}).call(this);

});

require.define("/author/author-unit.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorUnit, dumbSingularize;
  dumbSingularize = require('../singularize').dumbSingularize;
  exports.AuthorUnit = AuthorUnit = (function() {
    function AuthorUnit(hash, activity) {
      this.hash = hash;
      this.activity = activity;
      this.name = hash.name, this.abbreviation = hash.abbreviation;
    }
    AuthorUnit.prototype.toRuntimeUnit = function(runtimeActivity) {
      var runtimeUnit;
      runtimeUnit = runtimeActivity.createUnit();
      runtimeUnit.setProperties({
        name: dumbSingularize(this.name),
        pluralName: this.name,
        abbreviation: this.abbreviation
      });
      return runtimeUnit;
    };
    return AuthorUnit;
  })();
}).call(this);

});

require.define("/runtime/runtime-activity.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  /*
    Output "Activity" object.
  
    This class maintains a set of child objects that represent something close to the output "Smartgraphs runtime JSON"
    format and has a toHash method to generate that format. (However, this class will likely maintain model objects that
    aren't explicitly represented in the final output hash or in the Smartgraphs runtime; for example, having an
    runtime/Graph class makes sense, even though the output hash is 'denormalized' and doesn't have an explicit
    representation of a Graph)
  
    Mostly, this class and the classes of its contained child objects implement builder methods that the author/* objects
    know how to call.
  */
  var Axis, Datadef, RuntimeActivity, RuntimePage, RuntimeUnit, Step, slugify;
  slugify = require('../slugify').slugify;
  RuntimePage = require('./runtime-page').RuntimePage;
  Step = require('./step').Step;
  Axis = require('./axis').Axis;
  RuntimeUnit = require('./runtime-unit').RuntimeUnit;
  Datadef = require('./datadef').Datadef;
  exports.RuntimeActivity = RuntimeActivity = (function() {
    function RuntimeActivity(owner, name) {
      this.owner = owner;
      this.name = name;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefs = {};
      this.nDatadefs = 0;
    }
    RuntimeActivity.prototype.getUrl = function() {
      return "/" + this.owner + "/" + (slugify(this.name));
    };
    /*
        Factories for stuff we own. Could be metaprogrammed.
      */
    RuntimeActivity.prototype.createPage = function() {
      var page;
      page = new RuntimePage;
      page.activity = this;
      return page;
    };
    RuntimeActivity.prototype.createStep = function() {
      var step;
      step = new Step;
      step.activity = this;
      return step;
    };
    RuntimeActivity.prototype.createUnit = function() {
      var unit;
      unit = new RuntimeUnit;
      unit.activity = this;
      return unit;
    };
    /*
        Forward references. So far only Units need this because everything else is defined inline, but this is expected
        to change, right?
      */
    RuntimeActivity.prototype.getUnitRef = function(name) {
      var ref;
      if (ref = this.unitRefs[name]) {
        return ref;
      } else {
        ref = this.unitRefs[name] = {
          name: name,
          unit: null
        };
      }
      return ref;
    };
    RuntimeActivity.prototype.defineUnit = function(unit) {
      var ref;
      ref = this.getUnitRef(unit.name);
      if (ref.unit != null) {
        throw new Error("Warning: redefining unit " + ref.name);
      }
      ref.unit = unit;
      return unit;
    };
    /*
        Things that are defined only inline (for now) and therefore don't need to be treated as forward references.
      */
    RuntimeActivity.prototype.createAndAppendAxis = function(_arg) {
      var axis, label, max, min, nSteps, unitRef;
      label = _arg.label, unitRef = _arg.unitRef, min = _arg.min, max = _arg.max, nSteps = _arg.nSteps;
      axis = new Axis({
        label: label,
        unitRef: unitRef,
        min: min,
        max: max,
        nSteps: nSteps,
        index: ++this.nAxes
      });
      axis.activity = this;
      this.axes[axis.getUrl()] = axis;
      return axis;
    };
    RuntimeActivity.prototype.createAndAppendDatadef = function(_arg) {
      var data, datadef, xLabel, xUnitsRef, yLabel, yUnitsRef;
      data = _arg.data, xLabel = _arg.xLabel, xUnitsRef = _arg.xUnitsRef, yLabel = _arg.yLabel, yUnitsRef = _arg.yUnitsRef;
      datadef = new Datadef({
        data: data,
        xLabel: xLabel,
        xUnitsRef: xUnitsRef,
        yLabel: yLabel,
        yUnitsRef: yUnitsRef,
        index: ++this.nDatadefs
      });
      datadef.activity = this;
      this.datadefs[datadef.name] = datadef;
      return datadef;
    };
    RuntimeActivity.prototype.appendPage = function(page) {
      this.pages.push(page);
      page.setIndex(this.pages.length);
      return page;
    };
    RuntimeActivity.prototype.toHash = function() {
      var flatten, name, page, step, url;
      flatten = function(arrays) {
        var _ref;
        return (_ref = []).concat.apply(_ref, arrays);
      };
      return {
        _id: "" + (slugify(this.name)) + ".df6",
        _rev: 1,
        data_format_version: 6,
        activity: {
          title: this.name,
          url: this.getUrl(),
          owner: this.owner,
          pages: (function() {
            var _i, _len, _ref, _results;
            _ref = this.pages;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              page = _ref[_i];
              _results.push(page.getUrl());
            }
            return _results;
          }).call(this),
          axes: (function() {
            var _results;
            _results = [];
            for (url in this.axes) {
              _results.push(url);
            }
            return _results;
          }).call(this)
        },
        pages: (function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push(page.toHash());
          }
          return _results;
        }).call(this),
        steps: flatten((function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push((function() {
              var _j, _len2, _ref2, _results2;
              _ref2 = page.steps;
              _results2 = [];
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                step = _ref2[_j];
                _results2.push(step.toHash());
              }
              return _results2;
            })());
          }
          return _results;
        }).call(this)),
        responseTemplates: [],
        axes: (function() {
          var _results;
          _results = [];
          for (url in this.axes) {
            _results.push(this.axes[url].toHash());
          }
          return _results;
        }).call(this),
        datadefs: Datadef.serializeDatadefs((function() {
          var _results;
          _results = [];
          for (name in this.datadefs) {
            _results.push(this.datadefs[name]);
          }
          return _results;
        }).call(this)),
        tags: [],
        annotations: [],
        variables: [],
        units: (function() {
          var _results;
          _results = [];
          for (name in this.unitRefs) {
            _results.push(this.unitRefs[name].unit.toHash());
          }
          return _results;
        }).call(this)
      };
    };
    return RuntimeActivity;
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

require.define("/runtime/runtime-page.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var RuntimePage, slugify;
  slugify = require('../slugify').slugify;
  exports.RuntimePage = RuntimePage = (function() {
    function RuntimePage() {
      this.steps = [];
      this.index = null;
    }
    RuntimePage.prototype.setText = function(introText) {
      this.introText = introText;
      return this.introText;
    };
    RuntimePage.prototype.setName = function(name) {
      this.name = name;
      return this.name;
    };
    RuntimePage.prototype.setIndex = function(index) {
      this.index = index;
      return this.index;
    };
    RuntimePage.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/page/" + this.index + "-" + (slugify(this.name));
    };
    RuntimePage.prototype.appendStep = function() {
      var step;
      this.steps.push(step = this.activity.createStep());
      step.page = this;
      step.setIndex(this.steps.length);
      return step;
    };
    RuntimePage.prototype.toHash = function() {
      var step, _ref;
      return {
        name: this.name,
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        index: this.index,
        introText: this.introText,
        steps: (function() {
          var _i, _len, _ref, _results;
          _ref = this.steps;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            step = _ref[_i];
            _results.push(step.getUrl());
          }
          return _results;
        }).call(this),
        firstStep: (_ref = this.steps[0]) != null ? _ref.getUrl() : void 0
      };
    };
    return RuntimePage;
  })();
}).call(this);

});

require.define("/runtime/step.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Step;
  exports.Step = Step = (function() {
    function Step() {
      this.panesHash = null;
      this.page = null;
      this.index = null;
    }
    Step.prototype.addImagePane = function(url, license, attribution) {
      return this.panesHash = {
        single: {
          type: 'image',
          path: url,
          caption: "" + license + " " + attribution
        }
      };
    };
    Step.prototype.addGraphPane = function(_arg) {
      var datadef, title, xAxis, yAxis;
      title = _arg.title, datadef = _arg.datadef, xAxis = _arg.xAxis, yAxis = _arg.yAxis;
      return this.panesHash = {
        single: {
          type: 'graph',
          title: title,
          xAxis: xAxis.getUrl(),
          yAxis: yAxis.getUrl(),
          annotations: [],
          data: datadef != null ? [datadef.name] : []
        }
      };
    };
    Step.prototype.setIndex = function(index) {
      this.index = index;
      return this.index;
    };
    Step.prototype.getUrl = function() {
      return "" + (this.page.getUrl()) + "/step/" + this.index;
    };
    Step.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activityPage: this.page.getUrl(),
        paneConfig: 'single',
        panes: this.panesHash,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      };
    };
    return Step;
  })();
}).call(this);

});

require.define("/runtime/axis.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Axis;
  exports.Axis = Axis = (function() {
    function Axis(_arg) {
      this.label = _arg.label, this.unitRef = _arg.unitRef, this.min = _arg.min, this.max = _arg.max, this.nSteps = _arg.nSteps, this.index = _arg.index;
    }
    Axis.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/axes/" + this.index;
    };
    Axis.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        units: this.unitRef.unit.getUrl(),
        min: this.min,
        max: this.max,
        nSteps: this.nSteps,
        label: this.label
      };
    };
    return Axis;
  })();
}).call(this);

});

require.define("/runtime/runtime-unit.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var RuntimeUnit;
  exports.RuntimeUnit = RuntimeUnit = (function() {
    function RuntimeUnit() {}
    RuntimeUnit.prototype.setProperties = function(_arg) {
      this.name = _arg.name, this.abbreviation = _arg.abbreviation, this.pluralName = _arg.pluralName;
    };
    RuntimeUnit.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/units/" + this.pluralName;
    };
    RuntimeUnit.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        name: this.name,
        abbreviation: this.abbreviation,
        pluralName: this.pluralName
      };
    };
    return RuntimeUnit;
  })();
}).call(this);

});

require.define("/runtime/datadef.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  /*
    Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
    FirstOrderDifference and Function Datadefs
  */
  var Datadef;
  exports.Datadef = Datadef = (function() {
    Datadef.serializeDatadefs = function(datadefs) {
      var datadef;
      if (datadefs.length === 0) {
        return [];
      } else {
        return [
          {
            type: 'UnorderedDataPoints',
            records: (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = datadefs.length; _i < _len; _i++) {
                datadef = datadefs[_i];
                _results.push(datadef.toHash());
              }
              return _results;
            })()
          }
        ];
      }
    };
    function Datadef(_arg) {
      this.data = _arg.data, this.xLabel = _arg.xLabel, this.xUnitsRef = _arg.xUnitsRef, this.yLabel = _arg.yLabel, this.yUnitsRef = _arg.yUnitsRef, this.index = _arg.index;
      this.name = "datadef-" + this.index;
    }
    Datadef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datadefs/" + this.name;
    };
    Datadef.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        xUnits: this.xUnitsRef.unit.getUrl(),
        xLabel: this.xLabel,
        xShortLabel: this.xLabel,
        yUnits: this.yUnitsRef.unit.getUrl(),
        yLabel: this.yLabel,
        yShortLabel: this.yLabel,
        points: this.data
      };
    };
    return Datadef;
  })();
}).call(this);

});

require.define("/converter.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorActivity;
  AuthorActivity = require('./author/author-activity').AuthorActivity;
  exports.convert = function(input) {
    return new AuthorActivity(input).toRuntimeActivity().toHash();
  };
}).call(this);

});
require("/converter.js");

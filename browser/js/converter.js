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
      var page, runtimeActivity, runtimeUnit, unit, _i, _j, _len, _len2, _ref, _ref2;
      runtimeActivity = new RuntimeActivity(this.owner, this.name);
      _ref = this.pages;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        page = _ref[_i];
        runtimeActivity.appendPage(page.toRuntimePage(runtimeActivity));
      }
      _ref2 = this.units;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        unit = _ref2[_j];
        runtimeActivity.defineUnit((runtimeUnit = unit.toRuntimeUnit(runtimeActivity)).name, runtimeUnit);
      }
      return runtimeActivity;
    };
    return AuthorActivity;
  })();
}).call(this);

});

require.define("/author/author-page.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPage, AuthorPane, ImagePane, InstructionSequence, NoSequence, PickAPointSequence, PredefinedGraphPane, Sequence, TablePane, dumbSingularize;
  dumbSingularize = require('../singularize').dumbSingularize;
  exports.AuthorPage = AuthorPage = (function() {
    function AuthorPage(hash, activity, index) {
      var h, pane, _len, _ref, _ref2, _ref3, _ref4;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text;
      this.sequence = Sequence.fromHash(this.hash.sequence);
      this.sequence.page = this;
      if (((_ref2 = this.hash.panes) != null ? _ref2.length : void 0) > 2) {
        throw new Error("There cannot be more than two panes");
      }
      this.panes = this.hash.panes != null ? (function() {
        var _i, _len, _ref3, _results;
        _ref3 = this.hash.panes;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          h = _ref3[_i];
          _results.push(AuthorPane.fromHash(h));
        }
        return _results;
      }).call(this) : [];
      _ref3 = this.panes;
      for (index = 0, _len = _ref3.length; index < _len; index++) {
        pane = _ref3[index];
        _ref4 = [this, index], pane.page = _ref4[0], pane.index = _ref4[1];
      }
    }
    AuthorPage.prototype.toRuntimePage = function(runtimeActivity) {
      var pane, runtimePage, _i, _len, _ref;
      runtimePage = runtimeActivity.createPage();
      runtimePage.setName(this.name);
      runtimePage.setText(this.text);
      _ref = this.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToPageAndActivity(runtimePage, runtimeActivity);
      }
      this.sequence.appendSteps(runtimePage);
      return runtimePage;
    };
    return AuthorPage;
  })();
  /*
    Sequence types
  */
  Sequence = {
    classFor: {},
    fromHash: function(hash) {
      var SequenceClass;
      SequenceClass = this.classFor[(hash != null ? hash.type : void 0) || 'NoSequence'];
      if (!(SequenceClass != null)) {
        throw new Error("Sequence type " + hash.type + " is not supported");
      }
      return new SequenceClass(hash);
    }
  };
  Sequence.classFor['NoSequence'] = NoSequence = (function() {
    function NoSequence() {}
    NoSequence.prototype.appendSteps = function(runtimePage) {
      var pane, step, _i, _len, _ref, _results;
      step = runtimePage.appendStep();
      _ref = this.page.panes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.addToStep(step));
      }
      return _results;
    };
    return NoSequence;
  })();
  Sequence.classFor['InstructionSequence'] = InstructionSequence = (function() {
    function InstructionSequence(_arg) {
      this.text = _arg.text;
    }
    InstructionSequence.prototype.appendSteps = function(runtimePage) {
      var pane, step, _i, _len, _ref, _results;
      step = runtimePage.appendStep();
      step.setBeforeText(this.text);
      _ref = this.page.panes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.addToStep(step));
      }
      return _results;
    };
    return InstructionSequence;
  })();
  Sequence.classFor['PickAPointSequence'] = PickAPointSequence = (function() {
    PickAPointSequence.prototype.HIGHLIGHT_COLOR = '#1f77b4';
    function PickAPointSequence(_arg) {
      this.initialPrompt = _arg.initialPrompt, this.correctAnswerPoint = _arg.correctAnswerPoint, this.hints = _arg.hints, this.giveUp = _arg.giveUp, this.confirmCorrect = _arg.confirmCorrect;
    }
    PickAPointSequence.prototype.appendSteps = function(runtimePage) {
      var answerableSteps, confirmCorrectStep, datadefRef, giveUpStep, graphPane, highlightedPoint, hint, hintStep, i, index, initialPromptStep, lastAnswerableStep, pane, runtimeActivity, step, steps, tablePane, tag, _i, _j, _k, _len, _len2, _len3, _len4, _len5, _ref, _ref2, _ref3, _results;
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor['PredefinedGraphPane']) {
          graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor['TablePane']) {
          tablePane = pane;
        }
      }
      if (!(graphPane != null) && !(tablePane != null)) {
        throw new Error("PickAPointSequence requires at least one graph or table pane");
      }
      runtimeActivity = runtimePage.activity;
      datadefRef = runtimeActivity.getDatadefRef("" + this.page.index + "-" + graphPane.index);
      tag = runtimeActivity.createAndAppendTag();
      highlightedPoint = runtimeActivity.createAndAppendHighlightedPoint({
        datadefRef: datadefRef,
        tag: tag,
        color: this.HIGHLIGHT_COLOR
      });
      steps = [];
      answerableSteps = [];
      steps.push(initialPromptStep = runtimePage.appendStep());
      answerableSteps.push(initialPromptStep);
      initialPromptStep.setBeforeText(this.initialPrompt);
      _ref2 = this.hints;
      for (_i = 0, _len2 = _ref2.length; _i < _len2; _i++) {
        hint = _ref2[_i];
        steps.push(hintStep = runtimePage.appendStep());
        answerableSteps.push(hintStep);
        hintStep.setBeforeText(hint.text);
      }
      steps.push(giveUpStep = runtimePage.appendStep());
      giveUpStep.setBeforeText(this.giveUp.text);
      steps.push(confirmCorrectStep = runtimePage.appendStep());
      confirmCorrectStep.setBeforeText(this.confirmCorrect.text);
      for (_j = 0, _len3 = steps.length; _j < _len3; _j++) {
        step = steps[_j];
        _ref3 = this.page.panes;
        for (_k = 0, _len4 = _ref3.length; _k < _len4; _k++) {
          pane = _ref3[_k];
          pane.addToStep(step);
        }
      }
      lastAnswerableStep = answerableSteps[answerableSteps.length - 1];
      _results = [];
      for (index = 0, _len5 = answerableSteps.length; index < _len5; index++) {
        step = answerableSteps[index];
        if (graphPane != null) {
          step.addAnnotationToPane({
            annotation: highlightedPoint,
            index: graphPane.index
          });
        }
        if (tablePane != null) {
          step.addAnnotationToPane({
            annotation: highlightedPoint,
            index: tablePane.index
          });
        }
        step.addTaggingTool({
          tag: tag,
          datadefRef: datadefRef
        });
        step.setSubmitButtonTitle("Check My Answer");
        step.appendResponseBranch({
          criterion: ["coordinates=", tag.name, this.correctAnswerPoint[0], this.correctAnswerPoint[1]],
          step: confirmCorrectStep
        });
        _results.push(step === lastAnswerableStep ? step.setDefaultBranch(giveUpStep) : step.setDefaultBranch(answerableSteps[index + 1]));
      }
      return _results;
    };
    return PickAPointSequence;
  })();
  /*
    Pane types
  */
  AuthorPane = {
    classFor: {},
    fromHash: function(hash) {
      var PaneClass;
      PaneClass = this.classFor[hash.type];
      if (!(PaneClass != null)) {
        throw new Error("Pane type " + hash.type + " is not supported");
      }
      return new PaneClass(hash);
    }
  };
  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function() {
    function PredefinedGraphPane(_arg) {
      this.title = _arg.title, this.data = _arg.data, this.xLabel = _arg.xLabel, this.xUnits = _arg.xUnits, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yUnits = _arg.yUnits, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks;
    }
    PredefinedGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      var dataKey, datadef;
      if (this.xUnits) {
        this.xUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(this.xUnits));
      }
      if (this.yUnits) {
        this.yUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(this.yUnits));
      }
      this.xAxis = runtimeActivity.createAndAppendAxis({
        label: this.xLabel,
        unitRef: this.xUnitsRef,
        min: this.xMin,
        max: this.xMax,
        nSteps: this.xTicks
      });
      this.yAxis = runtimeActivity.createAndAppendAxis({
        label: this.yLabel,
        unitRef: this.yUnitsRef,
        min: this.yMin,
        max: this.yMax,
        nSteps: this.yTicks
      });
      if (this.data != null) {
        dataKey = "" + this.page.index + "-" + this.index;
        this.datadefRef = runtimeActivity.getDatadefRef(dataKey);
        datadef = runtimeActivity.createDatadef({
          points: this.data,
          xLabel: this.xLabel,
          xUnitsRef: this.xUnitsRef,
          yLabel: this.yLabel,
          yUnitsRef: this.yUnitsRef
        });
        return runtimeActivity.defineDatadef(dataKey, datadef);
      }
    };
    PredefinedGraphPane.prototype.addToStep = function(step) {
      return step.addGraphPane({
        title: this.title,
        datadefRef: this.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.index
      });
    };
    return PredefinedGraphPane;
  })();
  AuthorPane.classFor['ImagePane'] = ImagePane = (function() {
    function ImagePane(_arg) {
      this.url = _arg.url, this.license = _arg.license, this.attribution = _arg.attribution;
    }
    ImagePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {};
    ImagePane.prototype.addToStep = function(step) {
      return step.addImagePane({
        url: this.url,
        license: this.license,
        attribution: this.attribution,
        index: this.index
      });
    };
    return ImagePane;
  })();
  AuthorPane.classFor['TablePane'] = TablePane = (function() {
    function TablePane() {}
    TablePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      this.runtimeActivity = runtimeActivity;
    };
    TablePane.prototype.addToStep = function(step) {
      var dataKey, datadefRef, otherPaneIndex;
      otherPaneIndex = 1 - this.index;
      dataKey = "" + this.page.index + "-" + otherPaneIndex;
      datadefRef = this.runtimeActivity.getDatadefRef(dataKey);
      return step.addTablePane({
        datadefRef: datadefRef,
        index: this.index
      });
    };
    return TablePane;
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
  var Annotation, Axis, Datadef, HighlightedPoint, RuntimeActivity, RuntimePage, RuntimeUnit, Step, Tag, slugify, _ref;
  slugify = require('../slugify').slugify;
  RuntimePage = require('./runtime-page').RuntimePage;
  Step = require('./step').Step;
  Axis = require('./axis').Axis;
  RuntimeUnit = require('./runtime-unit').RuntimeUnit;
  Datadef = require('./datadef').Datadef;
  Tag = require('./tag').Tag;
  _ref = require('./annotations'), Annotation = _ref.Annotation, HighlightedPoint = _ref.HighlightedPoint;
  exports.RuntimeActivity = RuntimeActivity = (function() {
    function RuntimeActivity(owner, name) {
      this.owner = owner;
      this.name = name;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefRefs = {};
      this.nDatadefs = 0;
      this.annotations = {};
      this.nAnnotations = 0;
      this.tags = [];
      this.nTags = 0;
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
    RuntimeActivity.prototype.createDatadef = function(_arg) {
      var datadef, points, xLabel, xUnitsRef, yLabel, yUnitsRef;
      points = _arg.points, xLabel = _arg.xLabel, xUnitsRef = _arg.xUnitsRef, yLabel = _arg.yLabel, yUnitsRef = _arg.yUnitsRef;
      datadef = new Datadef({
        points: points,
        xLabel: xLabel,
        xUnitsRef: xUnitsRef,
        yLabel: yLabel,
        yUnitsRef: yUnitsRef,
        index: ++this.nDatadefs
      });
      datadef.activity = this;
      return datadef;
    };
    /*
        Forward references. Some of this is repetitious and should be factored out.
      */
    RuntimeActivity.prototype.getUnitRef = function(key) {
      var ref;
      if (ref = this.unitRefs[key]) {
        return ref;
      } else {
        ref = this.unitRefs[key] = {
          key: key,
          unit: null
        };
      }
      return ref;
    };
    RuntimeActivity.prototype.defineUnit = function(key, unit) {
      var ref;
      ref = this.getUnitRef(key);
      if (ref.unit != null) {
        throw new Error("Redefinition of unit " + key);
      }
      ref.unit = unit;
      return unit;
    };
    RuntimeActivity.prototype.getDatadefRef = function(key) {
      var ref;
      if (ref = this.datadefRefs[key]) {
        return ref;
      } else {
        ref = this.datadefRefs[key] = {
          key: key,
          datadef: null
        };
      }
      return ref;
    };
    RuntimeActivity.prototype.defineDatadef = function(key, datadef) {
      var ref;
      ref = this.getDatadefRef(key);
      if (ref.datadef != null) {
        throw new Error("Redefinition of datadef " + key);
      }
      ref.datadef = datadef;
      return datadef;
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
    RuntimeActivity.prototype.createAndAppendTag = function() {
      var tag;
      tag = new Tag({
        index: ++this.nTags
      });
      tag.activity = this;
      this.tags.push(tag);
      return tag;
    };
    RuntimeActivity.prototype.createAndAppendHighlightedPoint = function(_arg) {
      var color, datadefRef, point, tag, _base, _ref2;
      datadefRef = _arg.datadefRef, tag = _arg.tag, color = _arg.color;
      point = new HighlightedPoint({
        datadefRef: datadefRef,
        tag: tag,
        color: color,
        index: ++this.nAnnotations
      });
      point.activity = this;
      if ((_ref2 = (_base = this.annotations).highlightedPoints) == null) {
        _base.highlightedPoints = [];
      }
      this.annotations.highlightedPoints.push(point);
      return point;
    };
    RuntimeActivity.prototype.appendPage = function(page) {
      this.pages.push(page);
      page.setIndex(this.pages.length);
      return page;
    };
    RuntimeActivity.prototype.toHash = function() {
      var flatten, key, page, step, tag, url;
      flatten = function(arrays) {
        var _ref2;
        return (_ref2 = []).concat.apply(_ref2, arrays);
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
            var _i, _len, _ref2, _results;
            _ref2 = this.pages;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              page = _ref2[_i];
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
          var _i, _len, _ref2, _results;
          _ref2 = this.pages;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            page = _ref2[_i];
            _results.push(page.toHash());
          }
          return _results;
        }).call(this),
        steps: flatten((function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.pages;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            page = _ref2[_i];
            _results.push((function() {
              var _j, _len2, _ref3, _results2;
              _ref3 = page.steps;
              _results2 = [];
              for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                step = _ref3[_j];
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
          for (key in this.datadefRefs) {
            _results.push(this.datadefRefs[key].datadef);
          }
          return _results;
        }).call(this)),
        tags: (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.tags;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            tag = _ref2[_i];
            _results.push(tag.toHash());
          }
          return _results;
        }).call(this),
        annotations: Annotation.serializeAnnotations(this.annotations),
        variables: [],
        units: (function() {
          var _results;
          _results = [];
          for (key in this.unitRefs) {
            _results.push(this.unitRefs[key].unit.toHash());
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
      this.panes = [];
      this.tools = {};
      this.responseBranches = [];
      this.isFinalStep = true;
      this.nextButtonShouldSubmit = true;
      this.page = null;
      this.index = null;
    }
    Step.prototype.setIndex = function(index) {
      this.index = index;
    };
    Step.prototype.setBeforeText = function(beforeText) {
      this.beforeText = beforeText;
    };
    Step.prototype.setSubmitButtonTitle = function(submitButtonTitle) {
      this.submitButtonTitle = submitButtonTitle;
    };
    Step.prototype.setDefaultBranch = function(defaultBranch) {
      this.defaultBranch = defaultBranch;
    };
    Step.prototype.getUrl = function() {
      return "" + (this.page.getUrl()) + "/step/" + this.index;
    };
    Step.prototype.addImagePane = function(_arg) {
      var attribution, index, license, url;
      url = _arg.url, license = _arg.license, attribution = _arg.attribution, index = _arg.index;
      return this.panes[index] = {
        url: url,
        license: license,
        attribution: attribution,
        toHash: function() {
          return {
            type: 'image',
            path: this.url,
            caption: "" + this.license + " " + this.attribution
          };
        }
      };
    };
    Step.prototype.addGraphPane = function(_arg) {
      var datadefRef, index, title, xAxis, yAxis;
      title = _arg.title, datadefRef = _arg.datadefRef, xAxis = _arg.xAxis, yAxis = _arg.yAxis, index = _arg.index;
      return this.panes[index] = {
        title: title,
        datadefRef: datadefRef,
        xAxis: xAxis,
        yAxis: yAxis,
        annotations: [],
        toHash: function() {
          var annotation;
          return {
            type: 'graph',
            title: this.title,
            xAxis: this.xAxis.getUrl(),
            yAxis: this.yAxis.getUrl(),
            annotations: (function() {
              var _i, _len, _ref, _results;
              _ref = this.annotations;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                annotation = _ref[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this),
            data: this.datadefRef != null ? [this.datadefRef.datadef.name] : []
          };
        }
      };
    };
    Step.prototype.addTablePane = function(_arg) {
      var datadefRef, index;
      datadefRef = _arg.datadefRef, index = _arg.index;
      return this.panes[index] = {
        datadefRef: datadefRef,
        annotations: [],
        toHash: function() {
          var annotation;
          return {
            type: 'table',
            data: this.datadefRef.datadef.name,
            annotations: (function() {
              var _i, _len, _ref, _results;
              _ref = this.annotations;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                annotation = _ref[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this)
          };
        }
      };
    };
    Step.prototype.addAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].annotations.push(annotation);
    };
    Step.prototype.addTaggingTool = function(_arg) {
      var datadefRef, tag;
      tag = _arg.tag, datadefRef = _arg.datadefRef;
      return this.tools['tagging'] = {
        tag: tag,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'tagging',
            setup: {
              tag: this.tag.name,
              data: this.datadefRef.datadef.name
            }
          };
        }
      };
    };
    Step.prototype.appendResponseBranch = function(_arg) {
      var criterion, step;
      criterion = _arg.criterion, step = _arg.step;
      return this.responseBranches.push({
        criterion: criterion,
        step: step,
        toHash: function() {
          return {
            criterion: this.criterion,
            step: this.step.getUrl()
          };
        }
      });
    };
    Step.prototype.getPaneKey = function(numPanes, index) {
      if (numPanes === 1) {
        return "single";
      } else if (index === 0) {
        return "top";
      } else {
        return "bottom";
      }
    };
    Step.prototype.makeNonFinal = function() {
      var _ref;
      if ((_ref = this.submitButtonTitle) == null) {
        this.submitButtonTitle = "OK";
      }
      this.isFinalStep = false;
      return delete this.nextButtonShouldSubmit;
    };
    Step.prototype.toHash = function() {
      var branch, key, panesHash, tool, toolsHash;
      panesHash = this.panes.length === 1 ? {
        single: this.panes[0].toHash()
      } : this.panes.length === 2 ? {
        top: this.panes[0].toHash(),
        bottom: this.panes[1].toHash()
      } : void 0;
      toolsHash = (function() {
        var _ref, _results;
        _ref = this.tools;
        _results = [];
        for (key in _ref) {
          tool = _ref[key];
          _results.push(tool.toHash());
        }
        return _results;
      }).call(this);
      if ((this.defaultBranch != null) || this.responseBranches.length > 0) {
        this.makeNonFinal();
      }
      return {
        url: this.getUrl(),
        activityPage: this.page.getUrl(),
        beforeText: this.beforeText,
        paneConfig: this.panes.length === 2 ? 'split' : 'single',
        panes: panesHash != null ? panesHash : null,
        tools: toolsHash.length > 0 ? toolsHash : void 0,
        submitButtonTitle: this.submitButtonTitle,
        defaultBranch: this.defaultBranch != null ? this.defaultBranch.getUrl() : void 0,
        responseBranches: (function() {
          var _i, _len, _ref, _results;
          if (this.responseBranches.length > 0) {
            _ref = this.responseBranches;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              branch = _ref[_i];
              _results.push(branch.toHash());
            }
            return _results;
          }
        }).call(this),
        isFinalStep: this.isFinalStep,
        nextButtonShouldSubmit: this.nextButtonShouldSubmit
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
      var _ref;
      return {
        url: this.getUrl(),
        units: (_ref = this.unitRef) != null ? _ref.unit.getUrl() : void 0,
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
      this.points = _arg.points, this.xLabel = _arg.xLabel, this.xUnitsRef = _arg.xUnitsRef, this.yLabel = _arg.yLabel, this.yUnitsRef = _arg.yUnitsRef, this.index = _arg.index;
      this.name = "datadef-" + this.index;
    }
    Datadef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datadefs/" + this.name;
    };
    Datadef.prototype.toHash = function() {
      var _ref, _ref2;
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        xUnits: (_ref = this.xUnitsRef) != null ? _ref.unit.getUrl() : void 0,
        xLabel: this.xLabel,
        xShortLabel: this.xLabel,
        yUnits: (_ref2 = this.yUnitsRef) != null ? _ref2.unit.getUrl() : void 0,
        yLabel: this.yLabel,
        yShortLabel: this.yLabel,
        points: this.points
      };
    };
    return Datadef;
  })();
}).call(this);

});

require.define("/runtime/tag.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Tag;
  exports.Tag = Tag = (function() {
    function Tag(_arg) {
      this.index = _arg.index;
      this.name = "tag-" + this.index;
    }
    Tag.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/tags/" + this.name;
    };
    Tag.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        name: this.name
      };
    };
    return Tag;
  })();
}).call(this);

});

require.define("/runtime/annotations.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  /*
    Annotation class and its subclasses
  */
  var Annotation, HighlightedPoint;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  exports.Annotation = Annotation = (function() {
    function Annotation() {}
    Annotation.serializeAnnotations = function(allAnnotations) {
      var annotation, annotationsOfOneType, key, ret;
      ret = [];
      for (key in allAnnotations) {
        annotationsOfOneType = allAnnotations[key];
        ret.push({
          type: annotationsOfOneType[0].RECORD_TYPE,
          records: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = annotationsOfOneType.length; _i < _len; _i++) {
              annotation = annotationsOfOneType[_i];
              _results.push(annotation.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };
    Annotation.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/annotations/" + this.name;
    };
    Annotation.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl()
      };
    };
    return Annotation;
  })();
  exports.HighlightedPoint = HighlightedPoint = (function() {
    __extends(HighlightedPoint, Annotation);
    HighlightedPoint.prototype.RECORD_TYPE = 'HighlightedPoint';
    function HighlightedPoint(_arg) {
      this.datadefRef = _arg.datadefRef, this.tag = _arg.tag, this.color = _arg.color, this.index = _arg.index;
      this.name = "highlighted-point-" + this.index;
    }
    HighlightedPoint.prototype.toHash = function() {
      var hash;
      hash = HighlightedPoint.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.tag = this.tag.getUrl();
      hash.color = this.color;
      return hash;
    };
    return HighlightedPoint;
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

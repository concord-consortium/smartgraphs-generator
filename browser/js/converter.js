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

(function() {
  var Animation, AuthorActivity, AuthorPage, AuthorUnit, RuntimeActivity;

  AuthorPage = require('./author-page').AuthorPage;

  AuthorUnit = require('./author-unit').AuthorUnit;

  Animation = require('./animation').Animation;

  RuntimeActivity = require('../runtime/runtime-activity').RuntimeActivity;

  exports.AuthorActivity = AuthorActivity = (function() {

    function AuthorActivity(hash) {
      var animation, dataset, i, page, unit, _i, _j, _len, _len2, _ref, _ref2;
      this.hash = hash;
      if (this.hash.type !== 'Activity') {
        throw new Error("smartgraphs-generator: AuthorActivity constructor was called with a hash whose toplevel element does not have type: \"Activity\"");
      }
      this.name = hash.name, this.owner = hash.owner, this.authorName = hash.authorName;
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
      this.animations = (function() {
        var _i, _len, _ref, _results;
        _ref = hash.animations || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          animation = _ref[_i];
          _results.push(new Animation(animation, this));
        }
        return _results;
      }).call(this);
      this.animationsByName = {};
      _ref = this.animations;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        animation = _ref[_i];
        if (this.animationsByName[animation.name]) {
          throw new Error("More than one animation object named " + animation.name);
        }
        this.animationsByName[animation.name] = animation;
      }
      this.datasets = hash.datasets || [];
      this.datasetsByName = {};
      _ref2 = this.datasets;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        dataset = _ref2[_j];
        if (this.datasetsByName[dataset.name]) {
          throw new Error("More than one dataset named " + dataset.name);
        }
        this.datasetsByName[dataset.name] = dataset;
      }
    }

    AuthorActivity.prototype.toRuntimeActivity = function() {
      var i, label, labelObject, labelSet, labelsArray, page, runtimeActivity, runtimeUnit, unit, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4;
      runtimeActivity = new RuntimeActivity(this.owner, this.name, this.authorName, this.hash.datasets, this.hash.labelSets);
      if (this.hash.labelSets) {
        _ref = this.hash.labelSets;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          labelSet = _ref[i];
          labelsArray = [];
          _ref2 = labelSet.labels;
          for (_i = 0, _len2 = _ref2.length; _i < _len2; _i++) {
            label = _ref2[_i];
            label.type = 'Label';
            label.namePrefix = labelSet.name;
            labelObject = runtimeActivity.createAndAppendAnnotation(label);
            labelsArray.push(labelObject.getUrl());
          }
          runtimeActivity.createAndAppendAnnotation({
            name: labelSet.name,
            labels: labelsArray,
            type: 'LabelSet'
          });
        }
      }
      _ref3 = this.units;
      for (_j = 0, _len3 = _ref3.length; _j < _len3; _j++) {
        unit = _ref3[_j];
        runtimeActivity.defineUnit((runtimeUnit = unit.toRuntimeUnit(runtimeActivity)).name, runtimeUnit);
      }
      _ref4 = this.pages;
      for (_k = 0, _len4 = _ref4.length; _k < _len4; _k++) {
        page = _ref4[_k];
        runtimeActivity.appendPage(page.toRuntimePage(runtimeActivity));
      }
      return runtimeActivity;
    };

    return AuthorActivity;

  })();

}).call(this);

});

require.define("/author/author-page.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPage, AuthorPane, Sequence;

  Sequence = require('./sequences').Sequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.AuthorPage = AuthorPage = (function() {

    function AuthorPage(hash, activity, index) {
      var h, pane, sequence, _len, _ref, _ref2, _ref3, _ref4, _ref5;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text;
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
      sequence = (_ref5 = this.hash.sequence) != null ? _ref5 : {};
      sequence.page = this;
      this.sequence = Sequence.fromHash(sequence);
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

}).call(this);

});

require.define("/author/sequences.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPane, BestFitSequence, ConstructedResponseSequence, CorrectableSequenceWithFeedback, InstructionSequence, LabelSequence, LineConstructionSequence, MultipleChoiceWithCustomHintsSequence, MultipleChoiceWithSequentialHintsSequence, NoSequence, NumericSequence, PickAPointSequence, Sequence, SlopeToolSequence, asObject,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  AuthorPane = require('./author-panes').AuthorPane;

  SlopeToolSequence = require('./slope_tool_sequence').SlopeToolSequence;

  LineConstructionSequence = require('./line_construction_sequence').LineConstructionSequence;

  BestFitSequence = require('./best_fit_sequence').BestFitSequence;

  LabelSequence = require('./label_sequence').LabelSequence;

  asObject = function(s) {
    if (typeof s === 'string') {
      return {
        text: s
      };
    } else {
      return s;
    }
  };

  Sequence = exports.Sequence = {
    classFor: {},
    fromHash: function(hash) {
      var SequenceClass, _ref;
      SequenceClass = this.classFor[(_ref = hash.type) != null ? _ref : 'NoSequence'];
      if (!(SequenceClass != null)) {
        throw new Error("Sequence type " + hash.type + " is not supported");
      }
      return new SequenceClass(hash);
    }
  };

  Sequence.classFor['NoSequence'] = NoSequence = (function() {

    function NoSequence(_arg) {
      var i, pane, _len, _ref;
      this.page = _arg.page;
      this.predictionPanes = [];
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor['PredictionGraphPane']) {
          this.predictionPanes.push(pane);
        }
      }
    }

    NoSequence.prototype.appendSteps = function(runtimePage) {
      var i, isActiveInputPane, n, numSteps, pane, previousAnnotation, runtimeActivity, step, steps, _len, _ref;
      steps = [];
      numSteps = this.predictionPanes.length || 1;
      runtimeActivity = runtimePage.activity;
      this.annotations = [];
      for (n = 0; 0 <= numSteps ? n < numSteps : n > numSteps; 0 <= numSteps ? n++ : n--) {
        step = runtimePage.appendStep();
        if (n !== 0) steps[n - 1].setDefaultBranch(step);
        _ref = this.page.panes;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          pane = _ref[i];
          isActiveInputPane = (i === n) || (this.predictionPanes.length === 1);
          previousAnnotation = !isActiveInputPane && i === 0 ? this.page.panes[0].annotation : void 0;
          pane.addToStep(step, {
            isActiveInputPane: isActiveInputPane,
            previousAnnotation: previousAnnotation
          });
        }
        if (this.predictionPanes[n] != null) {
          step.setSubmissibilityCriterion([">=", ["sketchLength", this.predictionPanes[n].annotation.name], 0.2]);
          step.setSubmissibilityDependsOn(["annotation", this.predictionPanes[n].annotation.name]);
        }
        steps.push(step);
      }
      return steps;
    };

    return NoSequence;

  })();

  Sequence.classFor['InstructionSequence'] = InstructionSequence = (function(_super) {

    __extends(InstructionSequence, _super);

    function InstructionSequence(_arg) {
      this.text = _arg.text, this.page = _arg.page;
      InstructionSequence.__super__.constructor.apply(this, arguments);
    }

    InstructionSequence.prototype.appendSteps = function(runtimePage) {
      var step, steps, _i, _len, _results;
      steps = InstructionSequence.__super__.appendSteps.apply(this, arguments);
      _results = [];
      for (_i = 0, _len = steps.length; _i < _len; _i++) {
        step = steps[_i];
        _results.push(step.setBeforeText(this.text));
      }
      return _results;
    };

    return InstructionSequence;

  })(NoSequence);

  Sequence.classFor['ConstructedResponseSequence'] = ConstructedResponseSequence = (function() {

    function ConstructedResponseSequence(_arg) {
      this.initialPrompt = _arg.initialPrompt, this.initialContent = _arg.initialContent, this.page = _arg.page;
      this.initialPrompt = asObject(this.initialPrompt);
    }

    ConstructedResponseSequence.prototype.appendSteps = function(runtimePage) {
      var pane, responseTemplate, runtimeActivity, step, _i, _len, _ref, _results;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate("ConstructedResponseTemplate", [this.initialContent]);
      step = runtimePage.appendStep();
      step.setBeforeText(this.initialPrompt.text);
      step.setSubmissibilityCriterion(["textLengthIsAtLeast", 1, ["responseField", 1]]);
      step.setResponseTemplate(responseTemplate);
      _ref = this.page.panes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.addToStep(step));
      }
      return _results;
    };

    return ConstructedResponseSequence;

  })();

  Sequence.classFor['MultipleChoiceWithCustomHintsSequence'] = MultipleChoiceWithCustomHintsSequence = (function() {

    function MultipleChoiceWithCustomHintsSequence(_arg) {
      var hint, i, indexed, pane, _i, _len, _len2, _ref, _ref2, _ref3;
      this.initialPrompt = _arg.initialPrompt, this.choices = _arg.choices, this.correctAnswerIndex = _arg.correctAnswerIndex, this.hints = _arg.hints, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page;
      _ref = [this.initialPrompt, this.confirmCorrect].map(asObject), this.initialPrompt = _ref[0], this.confirmCorrect = _ref[1];
      indexed = [];
      _ref2 = this.hints;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        hint = _ref2[_i];
        indexed[hint.choiceIndex] = hint;
      }
      _ref3 = this.page.panes || [];
      for (i = 0, _len2 = _ref3.length; i < _len2; i++) {
        pane = _ref3[i];
        if (pane instanceof AuthorPane.classFor['PredefinedGraphPane']) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor['TablePane']) {
          this.tablePane = pane;
        }
      }
      this.orderedHints = (function() {
        var _j, _len3, _results;
        _results = [];
        for (_j = 0, _len3 = indexed.length; _j < _len3; _j++) {
          hint = indexed[_j];
          if (hint != null) _results.push(hint);
        }
        return _results;
      })();
    }

    MultipleChoiceWithCustomHintsSequence.prototype.getCriterionForChoice = function(choiceIndex) {
      return ["=", ["responseField", 1], 1 + choiceIndex];
    };

    MultipleChoiceWithCustomHintsSequence.prototype.getHasVisualPrompts = function() {
      var feedback, _i, _len, _ref, _ref2;
      _ref = this.hints.concat(this.initialPrompt, this.giveUp, this.confirmCorrect);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        feedback = _ref[_i];
        if (((_ref2 = feedback.visualPrompts) != null ? _ref2.length : void 0) > 0) {
          return true;
        }
      }
      return false;
    };

    MultipleChoiceWithCustomHintsSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    MultipleChoiceWithCustomHintsSequence.prototype.appendSteps = function(runtimePage) {
      var answerableSteps, confirmCorrectStep, hint, hintStepsByChoiceIndex, index, pane, prompt, promptHash, responseTemplate, runtimeActivity, step, stepInfo, steps, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _ref, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _results;
      runtimeActivity = runtimePage.activity;
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate('MultipleChoiceTemplate', [''], this.choices);
      steps = [];
      answerableSteps = [];
      hintStepsByChoiceIndex = [];
      _ref = [this.initialPrompt].concat(this.orderedHints).concat([this.confirmCorrect]);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stepInfo = _ref[_i];
        step = runtimePage.appendStep();
        steps.push(step);
        if (stepInfo !== this.confirmCorrect) answerableSteps.push(step);
        if (!(stepInfo === this.initialPrompt || stepInfo === this.confirmCorrect)) {
          hintStepsByChoiceIndex[stepInfo.choiceIndex] = step;
        }
        if (stepInfo === this.confirmCorrect) confirmCorrectStep = step;
        _ref2 = this.page.panes;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          pane = _ref2[_j];
          pane.addToStep(step);
        }
        step.setBeforeText(stepInfo.text);
        _ref4 = (_ref3 = stepInfo.visualPrompts) != null ? _ref3 : [];
        for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
          prompt = _ref4[_k];
          promptHash = {
            type: prompt.type,
            datadefRef: this.datadefRef,
            color: prompt.color,
            x: (_ref5 = (_ref6 = prompt.point) != null ? _ref6[0] : void 0) != null ? _ref5 : void 0,
            y: (_ref7 = (_ref8 = prompt.point) != null ? _ref8[1] : void 0) != null ? _ref7 : void 0,
            xMin: (_ref9 = prompt.xMin) != null ? _ref9 : -Infinity,
            xMax: (_ref10 = prompt.xMax) != null ? _ref10 : Infinity,
            axis: (_ref11 = prompt.axis) != null ? _ref11.replace("_axis", "") : void 0
          };
          step.addAnnotationToPane({
            annotation: runtimeActivity.createAndAppendAnnotation(promptHash),
            index: this.graphPane.index
          });
        }
      }
      _results = [];
      for (index = 0, _len4 = answerableSteps.length; index < _len4; index++) {
        step = answerableSteps[index];
        step.setSubmitButtonTitle("Check My Answer");
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        step.setResponseTemplate(responseTemplate);
        step.appendResponseBranch({
          criterion: this.getCriterionForChoice(this.correctAnswerIndex),
          step: confirmCorrectStep
        });
        _ref12 = this.orderedHints;
        for (_l = 0, _len5 = _ref12.length; _l < _len5; _l++) {
          hint = _ref12[_l];
          step.appendResponseBranch({
            criterion: this.getCriterionForChoice(hint.choiceIndex),
            step: hintStepsByChoiceIndex[hint.choiceIndex]
          });
        }
        _results.push(step.setDefaultBranch(step));
      }
      return _results;
    };

    return MultipleChoiceWithCustomHintsSequence;

  })();

  CorrectableSequenceWithFeedback = (function() {

    CorrectableSequenceWithFeedback.prototype.HIGHLIGHT_COLOR = '#1f77b4';

    function CorrectableSequenceWithFeedback(_arg) {
      var i, pane, _len, _ref, _ref2;
      this.initialPrompt = _arg.initialPrompt, this.hints = _arg.hints, this.giveUp = _arg.giveUp, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page, this.dataSetName = _arg.dataSetName;
      _ref = [this.initialPrompt, this.giveUp, this.confirmCorrect].map(asObject), this.initialPrompt = _ref[0], this.giveUp = _ref[1], this.confirmCorrect = _ref[2];
      _ref2 = this.page.panes || [];
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        pane = _ref2[i];
        if (pane instanceof AuthorPane.classFor['PredefinedGraphPane']) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor['TablePane']) {
          this.tablePane = pane;
        }
      }
      if ((this.dataSetName != null) && (this.graphPane != null)) {
        this.graphPane.activeDatasetName = this.dataSetName;
      }
    }

    CorrectableSequenceWithFeedback.prototype.getRequiresGraphOrTable = function() {
      return this.getHasVisualPrompts() || this.getNeedsGraphData();
    };

    CorrectableSequenceWithFeedback.prototype.getNeedsGraphData = function() {
      return false;
    };

    CorrectableSequenceWithFeedback.prototype.getHasVisualPrompts = function() {
      var feedback, _i, _len, _ref, _ref2;
      _ref = this.hints.concat(this.initialPrompt, this.giveUp, this.confirmCorrect);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        feedback = _ref[_i];
        if (((_ref2 = feedback.visualPrompts) != null ? _ref2.length : void 0) > 0) {
          return true;
        }
      }
      return false;
    };

    CorrectableSequenceWithFeedback.prototype.getCriterion = function() {
      return [];
    };

    CorrectableSequenceWithFeedback.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    CorrectableSequenceWithFeedback.prototype.appendStepsWithModifier = function(runtimePage, modifyForSequenceType) {
      var addPanesAndFeedbackToStep, answerableInfo, answerableSteps, confirmCorrectStep, giveUpStep, index, lastAnswerableStep, runtimeActivity, step, steps, _i, _len, _len2, _ref, _results,
        _this = this;
      if (this.getRequiresGraphOrTable() && !(this.graphPane != null) && !(this.tablePane != null)) {
        throw new Error("Sequence requires at least one graph or table pane");
      }
      runtimeActivity = runtimePage.activity;
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      steps = [];
      answerableSteps = [];
      addPanesAndFeedbackToStep = function(_arg) {
        var from, pane, prompt, promptHash, step, _i, _j, _len, _len2, _ref, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _results;
        step = _arg.step, from = _arg.from;
        _ref = _this.page.panes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pane = _ref[_i];
          pane.addToStep(step);
        }
        step.setBeforeText(from.text);
        _ref3 = (_ref2 = from.visualPrompts) != null ? _ref2 : [];
        _results = [];
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          prompt = _ref3[_j];
          promptHash = {
            type: prompt.type,
            datadefRef: _this.datadefRef,
            color: prompt.color,
            x: (_ref4 = (_ref5 = prompt.point) != null ? _ref5[0] : void 0) != null ? _ref4 : void 0,
            y: (_ref6 = (_ref7 = prompt.point) != null ? _ref7[1] : void 0) != null ? _ref6 : void 0,
            xMin: (_ref8 = prompt.xMin) != null ? _ref8 : -Infinity,
            xMax: (_ref9 = prompt.xMax) != null ? _ref9 : Infinity,
            axis: (_ref10 = prompt.axis) != null ? _ref10.replace("_axis", "") : void 0
          };
          _results.push(step.addAnnotationToPane({
            annotation: runtimeActivity.createAndAppendAnnotation(promptHash),
            index: _this.graphPane.index
          }));
        }
        return _results;
      };
      _ref = (this.hints ? [this.initialPrompt].concat(this.hints) : [this.initialPrompt]);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        answerableInfo = _ref[_i];
        steps.push(step = runtimePage.appendStep());
        answerableSteps.push(step);
        addPanesAndFeedbackToStep({
          step: step,
          from: answerableInfo
        });
      }
      steps.push(giveUpStep = runtimePage.appendStep());
      addPanesAndFeedbackToStep({
        step: giveUpStep,
        from: this.giveUp
      });
      steps.push(confirmCorrectStep = runtimePage.appendStep());
      addPanesAndFeedbackToStep({
        step: confirmCorrectStep,
        from: this.confirmCorrect
      });
      lastAnswerableStep = answerableSteps[answerableSteps.length - 1];
      _results = [];
      for (index = 0, _len2 = answerableSteps.length; index < _len2; index++) {
        step = answerableSteps[index];
        modifyForSequenceType(step);
        step.setSubmitButtonTitle("Check My Answer");
        step.appendResponseBranch({
          criterion: this.getCriterion(),
          step: confirmCorrectStep
        });
        if (step === lastAnswerableStep) {
          _results.push(step.setDefaultBranch(giveUpStep));
        } else {
          _results.push(step.setDefaultBranch(answerableSteps[index + 1]));
        }
      }
      return _results;
    };

    return CorrectableSequenceWithFeedback;

  })();

  Sequence.classFor['PickAPointSequence'] = PickAPointSequence = (function(_super) {

    __extends(PickAPointSequence, _super);

    function PickAPointSequence(_arg) {
      this.correctAnswerPoint = _arg.correctAnswerPoint, this.correctAnswerRange = _arg.correctAnswerRange;
      PickAPointSequence.__super__.constructor.apply(this, arguments);
    }

    PickAPointSequence.prototype.getRequiresGraphOrTable = function() {
      return true;
    };

    PickAPointSequence.prototype.getCriterion = function() {
      if (this.correctAnswerPoint != null) {
        return ["coordinates=", this.tag.name, this.correctAnswerPoint[0], this.correctAnswerPoint[1]];
      }
      return ["coordinatesInRange", this.tag.name, this.correctAnswerRange.xMin, this.correctAnswerRange.yMin, this.correctAnswerRange.xMax, this.correctAnswerRange.yMax];
    };

    PickAPointSequence.prototype.appendStepsWithModifier = function(runtimePage, modifyForSequenceType) {
      var index, runtimeActivity, step, steps, _len, _results;
      PickAPointSequence.__super__.appendStepsWithModifier.apply(this, arguments);
      runtimeActivity = runtimePage.activity;
      if (this.initialPrompt.label) {
        this.label = runtimeActivity.createAndAppendAnnotation({
          type: 'Label',
          name: this.initialPrompt.label,
          text: 'New Label'
        });
        steps = runtimePage.steps;
        _results = [];
        for (index = 0, _len = steps.length; index < _len; index++) {
          step = steps[index];
          if (index !== 0) {
            if (this.graphPane != null) {
              _results.push(step.addAnnotationToPane({
                annotation: this.label,
                index: this.graphPane.index
              }));
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    PickAPointSequence.prototype.appendSteps = function(runtimePage) {
      var datadefRef, modifierForSequenceType, runtimeActivity,
        _this = this;
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.tag = runtimeActivity.createAndAppendTag();
      this.highlightedPoint = runtimeActivity.createAndAppendAnnotation({
        type: "HighlightedPoint",
        datadefRef: datadefRef,
        tag: this.tag,
        color: this.HIGHLIGHT_COLOR
      });
      modifierForSequenceType = function(step) {
        if (_this.initialPrompt.label) {
          step.addLabelTool({
            labelName: _this.initialPrompt.label,
            index: _this.graphPane.index,
            datadefRef: _this.datadefRef,
            markOnDataPoints: true,
            allowCoordinatesChange: true
          });
          step.addTaggingTool({
            tag: _this.tag,
            datadefRef: _this.datadefRef,
            labelName: _this.initialPrompt.label
          });
        } else {
          step.addTaggingTool({
            tag: _this.tag,
            datadefRef: _this.datadefRef
          });
        }
        if (_this.graphPane != null) {
          step.addAnnotationToPane({
            annotation: _this.highlightedPoint,
            index: _this.graphPane.index
          });
        }
        if (_this.tablePane != null) {
          return step.addAnnotationToPane({
            annotation: _this.highlightedPoint,
            index: _this.tablePane.index
          });
        }
      };
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };

    return PickAPointSequence;

  })(CorrectableSequenceWithFeedback);

  Sequence.classFor['NumericSequence'] = NumericSequence = (function(_super) {

    __extends(NumericSequence, _super);

    function NumericSequence(_arg) {
      var _ref;
      this.correctAnswer = _arg.correctAnswer, this.tolerance = _arg.tolerance;
      this.tolerance = (_ref = this.tolerance) != null ? _ref : 0.01;
      NumericSequence.__super__.constructor.apply(this, arguments);
    }

    NumericSequence.prototype.getCriterion = function() {
      return ["withinAbsTolerance", ["responseField", 1], this.correctAnswer, this.tolerance];
    };

    NumericSequence.prototype.appendSteps = function(runtimePage) {
      var modifierForSequenceType, responseTemplate, runtimeActivity,
        _this = this;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate("NumericResponseTemplate");
      modifierForSequenceType = function(step) {
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        return step.setResponseTemplate(responseTemplate);
      };
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };

    return NumericSequence;

  })(CorrectableSequenceWithFeedback);

  Sequence.classFor['MultipleChoiceWithSequentialHintsSequence'] = MultipleChoiceWithSequentialHintsSequence = (function(_super) {

    __extends(MultipleChoiceWithSequentialHintsSequence, _super);

    function MultipleChoiceWithSequentialHintsSequence(_arg) {
      this.correctAnswerIndex = _arg.correctAnswerIndex, this.choices = _arg.choices;
      MultipleChoiceWithSequentialHintsSequence.__super__.constructor.apply(this, arguments);
    }

    MultipleChoiceWithSequentialHintsSequence.prototype.getCriterion = function() {
      return ["=", ["responseField", 1], 1 + this.correctAnswerIndex];
    };

    MultipleChoiceWithSequentialHintsSequence.prototype.appendSteps = function(runtimePage) {
      var modifierForSequenceType, responseTemplate, runtimeActivity,
        _this = this;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate('MultipleChoiceTemplate', [''], this.choices);
      modifierForSequenceType = function(step) {
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        return step.setResponseTemplate(responseTemplate);
      };
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };

    return MultipleChoiceWithSequentialHintsSequence;

  })(CorrectableSequenceWithFeedback);

  Sequence.classFor['SlopeToolSequence'] = SlopeToolSequence;

  Sequence.classFor['LineConstructionSequence'] = LineConstructionSequence;

  Sequence.classFor['BestFitSequence'] = BestFitSequence;

  Sequence.classFor['LabelSequence'] = LabelSequence;

}).call(this);

});

require.define("/author/author-panes.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AnimationPane, AuthorPane, EmptyPane, GraphPane, ImagePane, LinkedAnimationPane, PredefinedGraphPane, PredictionGraphPane, SensorGraphPane, TablePane, dumbSingularize,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  dumbSingularize = require('../singularize').dumbSingularize;

  AuthorPane = exports.AuthorPane = {
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

  GraphPane = (function() {

    function GraphPane(_arg) {
      var includeAnnotationsFrom;
      this.title = _arg.title, this.xLabel = _arg.xLabel, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks, includeAnnotationsFrom = _arg.includeAnnotationsFrom, this.showCrossHairs = _arg.showCrossHairs, this.showGraphGrid = _arg.showGraphGrid, this.showToolTipCoords = _arg.showToolTipCoords, this.includedDataSets = _arg.includedDataSets, this.labelSetNames = _arg.labelSetNames, this.labels = _arg.labels, this.animation = _arg.animation;
      this.activeDataSetIndex = 0;
      this.totalDatasetsIndex = 0;
      this.activeDatasetName;
      this.datadefRef = [];
      if (!this.includedDataSets) this.includedDataSets = [];
      if (!this.labelSetNames) this.labelSetNames = [];
      this.annotationSources = includeAnnotationsFrom != null ? includeAnnotationsFrom.map(function(source) {
        var page, pane, _ref;
        _ref = (source.match(/^page\/(\d+)\/pane\/(\d+)$/)).slice(1, 3).map(function(s) {
          return parseInt(s, 10) - 1;
        }), page = _ref[0], pane = _ref[1];
        return {
          page: page,
          pane: pane
        };
      }) : void 0;
    }

    GraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      var dataref, populatedDataDef, populatedDataDefs, populatedDataSets, _i, _j, _len, _len2, _ref;
      this.runtimeActivity = runtimeActivity;
      if (this.includedDataSets != null) {
        if (this.includedDataSets.length !== 0) {
          populatedDataSets = runtimeActivity.populateDataSet(this.includedDataSets);
          populatedDataDefs = populatedDataSets.datadefs;
          this.datarefs = populatedDataSets.datarefs;
          if (!this.activeDatasetName) {
            this.activeDatasetName = populatedDataDefs[this.activeDataSetIndex].name;
          }
          _ref = this.datarefs;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            dataref = _ref[_i];
            if (this.activeDatasetName === dataref.name) {
              this.activeDatasetName = dataref.datadefName;
              break;
            }
          }
          for (_j = 0, _len2 = populatedDataDefs.length; _j < _len2; _j++) {
            populatedDataDef = populatedDataDefs[_j];
            if (this.activeDatasetName === populatedDataDef.name) {
              this.xUnitsRef = populatedDataDef.xUnitsRef;
              this.yUnitsRef = populatedDataDef.yUnitsRef;
            }
            this.datadefRef.push(runtimeActivity.getDatadefRef(populatedDataDef.name));
          }
        }
      }
      this.xAxis = runtimeActivity.createAndAppendAxis({
        label: this.xLabel,
        unitRef: this.xUnitsRef,
        min: this.xMin,
        max: this.xMax,
        nSteps: this.xTicks
      });
      return this.yAxis = runtimeActivity.createAndAppendAxis({
        label: this.yLabel,
        unitRef: this.yUnitsRef,
        min: this.yMin,
        max: this.yMax,
        nSteps: this.yTicks
      });
    };

    GraphPane.prototype.addToStep = function(step) {
      var animation, createdAnnotation, label, labelName, labelSetName, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _ref5,
        _this = this;
      step.addGraphPane({
        title: this.title,
        datadefRef: this.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.index,
        showCrossHairs: this.showCrossHairs,
        showGraphGrid: this.showGraphGrid,
        showToolTipCoords: this.showToolTipCoords,
        includedDataSets: this.includedDataSets,
        activeDatasetName: this.activeDatasetName,
        dataref: this.datarefs,
        labelSetNames: this.labelSetNames
      });
      if (this.animation) {
        animation = this.page.activity.animationsByName[this.animation];
        step.addAnimationTool({
          index: this.index,
          animation: animation,
          hideGraph: false
        });
      }
      if (this.labelSetNames) {
        _ref = this.labelSetNames;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          labelSetName = _ref[_i];
          if (this.runtimeActivity.annotations['LabelSet']) {
            _ref2 = this.runtimeActivity.annotations['LabelSet'];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              createdAnnotation = _ref2[_j];
              if (createdAnnotation.name === labelSetName) {
                step.addAnnotationToPane({
                  annotation: createdAnnotation,
                  index: this.index
                });
              }
            }
          }
        }
      }
      _ref3 = this.labels || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        labelName = _ref3[_k];
        _ref4 = this.runtimeActivity.annotations.Label || [];
        for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
          label = _ref4[_l];
          if (label.name === labelName) {
            step.addAnnotationToPane({
              annotation: label,
              index: this.index
            });
          }
        }
      }
      return (_ref5 = this.annotationSources) != null ? _ref5.forEach(function(source) {
        var page, pages, pane;
        pages = _this.page.activity.pages;
        page = pages[source.page];
        pane = page != null ? page.panes[source.pane] : void 0;
        if (!(page != null)) {
          throw new Error("When attempting to include annotations from pane " + (source.pane + 1) + " of page " + (source.page + 1) + ", couldn't find the page.");
        }
        if (!(pane != null)) {
          throw new Error("When attempting to include annotations from pane " + (source.pane + 1) + " of page " + (source.page + 1) + ", couldn't find the pane.");
        }
        if (!(pane.annotation != null)) {
          throw new Error("When attempting to include annotations from pane " + (source.pane + 1) + " of page " + (source.page + 1) + ", couldn't find the annotation.");
        }
        return step.addAnnotationToPane({
          index: _this.index,
          annotation: pane.annotation
        });
      }) : void 0;
    };

    return GraphPane;

  })();

  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function(_super) {

    __extends(PredefinedGraphPane, _super);

    function PredefinedGraphPane() {
      PredefinedGraphPane.__super__.constructor.apply(this, arguments);
    }

    return PredefinedGraphPane;

  })(GraphPane);

  AuthorPane.classFor['LinkedAnimationPane'] = LinkedAnimationPane = (function(_super) {

    __extends(LinkedAnimationPane, _super);

    function LinkedAnimationPane() {
      LinkedAnimationPane.__super__.constructor.apply(this, arguments);
    }

    LinkedAnimationPane.prototype.addToStep = function(step) {
      var animation, animationKey, otherPaneIndex;
      LinkedAnimationPane.__super__.addToStep.apply(this, arguments);
      otherPaneIndex = 1 - this.index;
      animationKey = "" + this.page.panes[otherPaneIndex].animation;
      if (!(animationKey != null)) {
        throw new Error("A LinkedAnimationPane requires the other pane on the page to display an associated animation.");
      }
      animation = this.page.activity.animationsByName[animationKey];
      if (!(animation != null)) {
        throw new Error("Couldn't find the animation " + animationName + " in the activity.");
      }
      return animation.addLinkedAnimation({
        pane: this,
        datasets: this.includedDataSets
      });
    };

    return LinkedAnimationPane;

  })(GraphPane);

  AuthorPane.classFor['SensorGraphPane'] = SensorGraphPane = (function(_super) {

    __extends(SensorGraphPane, _super);

    function SensorGraphPane() {
      SensorGraphPane.__super__.constructor.apply(this, arguments);
    }

    SensorGraphPane.prototype.addToStep = function(step) {
      var dataKey, datadefRef, _i, _len, _ref;
      SensorGraphPane.__super__.addToStep.apply(this, arguments);
      dataKey = "" + this.activeDatasetName;
      datadefRef;
      _ref = this.datadefRef;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        datadefRef = _ref[_i];
        if (datadefRef.key === dataKey) datadefRef = datadefRef;
      }
      return step.addSensorTool({
        index: this.index,
        datadefRef: datadefRef
      });
    };

    return SensorGraphPane;

  })(GraphPane);

  AuthorPane.classFor['PredictionGraphPane'] = PredictionGraphPane = (function(_super) {

    __extends(PredictionGraphPane, _super);

    function PredictionGraphPane(_arg) {
      this.predictionType = _arg.predictionType;
      PredictionGraphPane.__super__.constructor.apply(this, arguments);
    }

    PredictionGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      PredictionGraphPane.__super__.addToPageAndActivity.apply(this, arguments);
      return this.annotation = runtimeActivity.createAndAppendAnnotation({
        type: 'FreehandSketch'
      });
    };

    PredictionGraphPane.prototype.addToStep = function(step, args) {
      var isActiveInputPane, previousAnnotation, uiBehavior;
      PredictionGraphPane.__super__.addToStep.apply(this, arguments);
      if (args != null) {
        isActiveInputPane = args.isActiveInputPane, previousAnnotation = args.previousAnnotation;
      } else {
        isActiveInputPane = true;
        previousAnnotation = void 0;
      }
      if (isActiveInputPane) {
        uiBehavior = this.predictionType === "continuous_curves" ? "freehand" : "extend";
        step.addPredictionTool({
          index: this.index,
          datadefRef: this.datadefRef,
          annotation: this.annotation,
          uiBehavior: uiBehavior
        });
        step.addAnnotationToPane({
          index: this.index,
          annotation: this.annotation
        });
      }
      if (previousAnnotation != null) {
        return step.addAnnotationToPane({
          index: this.index,
          annotation: previousAnnotation
        });
      }
    };

    return PredictionGraphPane;

  })(GraphPane);

  AuthorPane.classFor['ImagePane'] = ImagePane = (function() {

    function ImagePane(_arg) {
      this.url = _arg.url, this.license = _arg.license, this.attribution = _arg.attribution, this.show_full_image = _arg.show_full_image;
    }

    ImagePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {};

    ImagePane.prototype.addToStep = function(step) {
      return step.addImagePane({
        url: this.url,
        license: this.license,
        attribution: this.attribution,
        show_full_image: this.show_full_image,
        index: this.index
      });
    };

    return ImagePane;

  })();

  AuthorPane.classFor['TablePane'] = TablePane = (function() {

    function TablePane(_arg) {
      this.xLabel = _arg.xLabel, this.yLabel = _arg.yLabel;
    }

    TablePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      this.runtimeActivity = runtimeActivity;
    };

    TablePane.prototype.addToStep = function(step) {
      var dataKey, datadefRef, otherPaneIndex;
      otherPaneIndex = 1 - this.index;
      dataKey = "" + this.page.panes[otherPaneIndex].activeDatasetName;
      datadefRef = this.runtimeActivity.getDatadefRef(dataKey);
      return step.addTablePane({
        datadefRef: datadefRef,
        index: this.index,
        xLabel: this.xLabel,
        yLabel: this.yLabel
      });
    };

    return TablePane;

  })();

  AuthorPane.classFor['AnimationPane'] = AnimationPane = (function() {

    function AnimationPane(_arg) {
      this.animation = _arg.animation, this.xMin = _arg.xMin, this.xMax = _arg.xMax;
    }

    AnimationPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      var animation;
      animation = this.page.activity.animationsByName[this.animation];
      this.graphPane = new GraphPane({
        title: "",
        xLabel: "",
        xMin: this.xMin,
        xMax: this.xMax,
        xTicks: 1,
        yLabel: "",
        yMin: animation.yMin,
        yMax: animation.yMax,
        yTicks: 1,
        includedDataSets: [
          {
            name: animation.dataset,
            inLegend: false
          }
        ]
      });
      this.graphPane.index = this.index;
      this.graphPane.page = this.page;
      return this.graphPane.addToPageAndActivity(runtimePage, runtimeActivity);
    };

    AnimationPane.prototype.addToStep = function(step) {
      var animation;
      animation = this.page.activity.animationsByName[this.animation];
      this.graphPane.addToStep(step);
      return step.addAnimationTool({
        index: this.index,
        animation: animation,
        hideGraph: true
      });
    };

    return AnimationPane;

  })();

  AuthorPane.classFor['EmptyPane'] = EmptyPane = (function() {

    function EmptyPane() {}

    EmptyPane.prototype.addToPageAndActivity = function() {};

    EmptyPane.prototype.addToStep = function(step) {
      return step.addEmptyPane({
        index: this.index
      });
    };

    return EmptyPane;

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

require.define("/author/slope_tool_sequence.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPane, SlopeToolSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.SlopeToolSequence = SlopeToolSequence = (function() {

    SlopeToolSequence.prototype.select_first_point_first_time_text = function() {
      var results;
      results = "";
      if (this.firstQuestionIsSlopeQuestion) results = this.incorrect_text();
      results = "" + results + "\n" + (this.select_first_point_text());
      return results;
    };

    SlopeToolSequence.prototype.ending_text = function() {
      return "" + this.xMax + (this.xUnits.length > 0 ? this.xUnits : " for " + this.x_axis_name);
    };

    SlopeToolSequence.prototype.starting_text = function() {
      return "" + this.xMin + (this.xUnits.length > 0 ? this.xUnits : void 0);
    };

    SlopeToolSequence.prototype.click_ok_text = function() {
      return "<p>Then click \"OK\". </p>";
    };

    SlopeToolSequence.prototype.incorrect_text = function() {
      return "<p><strong>Incorrect.</strong></p>";
    };

    SlopeToolSequence.prototype.range_text = function(first_point) {
      if (first_point == null) first_point = true;
      if (this.selectedPointsMustBeAdjacent && !first_point) {
        return "a second <strong><em>adjacent</em></strong> \npoint between " + this.xMin + " and " + (this.ending_text()) + ".\n";
      } else if (this.studentMustSelectEndpointsOfRange) {
        if (first_point) {
          return "a point at \n<strong><em>one end</em></strong>  \nof the interval from\n" + (this.starting_text()) + " to " + (this.ending_text()) + ".";
        } else {
          return "the point at \n<strong><em>the other end</em></strong>  \nof the interval from\n" + (this.starting_text()) + " to " + (this.ending_text()) + ".";
        }
      } else {
        return "" + (first_point ? "a" : "a second") + " \npoint between " + this.xMin + " and " + (this.ending_text()) + ".";
      }
    };

    SlopeToolSequence.prototype.select_first_point_text = function() {
      return "<p> Click on " + (this.range_text()) + " </p>\n" + (this.click_ok_text());
    };

    SlopeToolSequence.prototype.first_point_wrong_text = function() {
      return "" + (this.incorrect_text()) + "\n<p>The point you have selected is not \n" + (this.range_text()) + "\nTry again.</p>\n" + (this.select_first_point_text());
    };

    SlopeToolSequence.prototype.select_second_point_text = function(first_time) {
      if (first_time == null) first_time = true;
      return "<p>Now click on\n" + (this.range_text(false)) + "</p>\n" + (this.click_ok_text());
    };

    SlopeToolSequence.prototype.second_point_out_of_range_text = function() {
      return "" + (this.incorrect_text()) + "\n<p> The point you have selected is not \n" + (this.range_text()) + "  \nTry again.</p>\n" + (this.select_second_point_text());
    };

    SlopeToolSequence.prototype.previous_answers = function() {
      return [
        {
          name: "student-response-field",
          value: ["responseField", 1]
        }
      ];
    };

    SlopeToolSequence.prototype.require_numeric_input = function(dest) {
      return ["isNumeric", ["responseField", 1]];
    };

    SlopeToolSequence.prototype.not_adjacent = function(dest, pointA, pointB) {
      if (pointA == null) pointA = this.firstPoint.name;
      if (pointB == null) pointB = this.secondPoint.name;
      return {
        criterion: ["!=", ["absDiff", ["indexInDataset", pointA], ["indexInDataset", pointB]], 1],
        step: dest
      };
    };

    SlopeToolSequence.prototype.same_point = function(dest, pointA, pointB) {
      if (pointA == null) pointA = this.firstPoint.name;
      if (pointB == null) pointB = this.secondPoint.name;
      return {
        criterion: ['samePoint', pointA, pointB],
        step: dest
      };
    };

    SlopeToolSequence.prototype.point_not_in_range = function(dest, pointName, axis, max, min) {
      var criterion;
      if (pointName == null) pointName = this.secondPoint.name;
      if (axis == null) axis = 'x';
      if (max == null) max = this.xMax;
      if (min == null) min = this.xMin;
      criterion = ["or", ["<", ["coord", axis, pointName], min], [">", ["coord", axis, pointName], max]];
      if (this.studentMustSelectEndpointsOfRange) {
        criterion = ["and", ["!=", ["coord", axis, pointName], min], ["!=", ["coord", axis, pointName], max]];
      }
      return {
        criterion: criterion,
        step: dest
      };
    };

    SlopeToolSequence.prototype.point_in_range = function(dest, pointName, axis, max, min) {
      var criterion;
      if (pointName == null) pointName = this.firstPoint.name;
      if (axis == null) axis = 'x';
      if (max == null) max = this.xMax;
      if (min == null) min = this.xMin;
      criterion = ["and", [">=", ["coord", axis, pointName], min], ["<=", ["coord", axis, pointName], max]];
      if (this.studentMustSelectEndpointsOfRange) {
        criterion = ["or", ["=", ["coord", axis, pointName], min], ["=", ["coord", axis, pointName], max]];
      }
      return {
        criterion: criterion,
        step: dest
      };
    };

    SlopeToolSequence.prototype.first_slope_default_branch = function() {
      if (this.studentSelectsPoints) return "select_first_point";
      return "when_line_appears";
    };

    SlopeToolSequence.prototype.second_point_response_branches = function() {
      var results;
      results = [];
      if (this.selectedPointsMustBeAdjacent) {
        results.push(this.not_adjacent('second_point_not_adjacent_and_should_be'));
      }
      results.push(this.same_point('second_point_duplicate_point'));
      results.push(this.point_not_in_range('second_point_out_of_range'));
      return results;
    };

    SlopeToolSequence.prototype.check_correct_slope = function(use_points) {
      var slope;
      if (use_points == null) use_points = true;
      if (use_points) {
        slope = ["slope", this.firstPoint.name, this.secondPoint.name];
      } else {
        slope = this.slope;
      }
      return [
        {
          criterion: ["withinAbsTolerance", ["responseField", 1], slope, this.tolerance],
          step: "confirm_correct"
        }
      ];
    };

    function SlopeToolSequence(_arg) {
      var i, pane, _len, _ref;
      this.firstQuestionIsSlopeQuestion = _arg.firstQuestionIsSlopeQuestion, this.studentSelectsPoints = _arg.studentSelectsPoints, this.selectedPointsMustBeAdjacent = _arg.selectedPointsMustBeAdjacent, this.studentMustSelectEndpointsOfRange = _arg.studentMustSelectEndpointsOfRange, this.slopeVariableName = _arg.slopeVariableName, this.firstQuestion = _arg.firstQuestion, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.tolerance = _arg.tolerance, this.page = _arg.page, this.dataSetName = _arg.dataSetName;
      this.precision = 2;
      if (!(this.slopeVariableName && this.slopeVariableName.length > 0)) {
        this.slopeVariableName = "slope";
      }
      this.runtimeStepsByName = {};
      this.slope = (this.yMax - this.yMin) / (this.xMax - this.xMin);
      this.steps = [];
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor['PredefinedGraphPane']) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor['TablePane']) {
          this.tablePane = pane;
        }
      }
      if (!this.graphPane) {
        throw new Error("Slope Tool Sequence requires a GraphPane on the page.");
      }
      if (!this.tablePane) {
        throw new Error("Slope Tool Sequence requires a TablePane on the page.");
      }
      if (this.dataSetName) this.graphPane.activeDatasetName = this.dataSetName;
    }

    SlopeToolSequence.prototype.getRequiresGraphOrTable = function() {
      return true;
    };

    SlopeToolSequence.prototype.getNeedsGraphData = function() {
      return true;
    };

    SlopeToolSequence.prototype.getHasVisualPrompts = function() {
      return true;
    };

    SlopeToolSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    SlopeToolSequence.prototype.setupStep = function(_arg) {
      var annotation, pane, responseTemplate, response_def, runtimePage, step, stepdef, tool, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _results;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef;
      step = this.runtimeStepsByName[stepdef.name];
      _ref = this.page.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToStep(step);
      }
      step.beforeText = stepdef.beforeText;
      step.substitutedExpressions = stepdef.substitutedExpressions;
      step.variableAssignments = stepdef.variableAssignments;
      step.submitButtonTitle = stepdef.submitButtonTitle;
      if (stepdef.responseTemplate) {
        responseTemplate = runtimePage.activity.createAndAppendResponseTemplate("NumericResponseTemplate");
        step.setSubmissibilityCriterion(stepdef.submissibilityCriterion);
        step.setResponseTemplate(responseTemplate);
      }
      _ref2 = stepdef.graphAnnotations || [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        annotation = _ref2[_j];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref3 = stepdef.highLightedGraphAnnotations || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        annotation = _ref3[_k];
        if (this.annotations[annotation]) {
          step.addHighlightedAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref4 = stepdef.tableAnnotations || [];
      for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
        annotation = _ref4[_l];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.tablePane.index
          });
        }
      }
      _ref5 = stepdef.highLightedTableAnnotations || [];
      for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
        annotation = _ref5[_m];
        if (this.annotations[annotation]) {
          step.addHighlightedAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.tablePane.index
          });
        }
      }
      _ref6 = stepdef.tools || [];
      for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
        tool = _ref6[_n];
        step.addTaggingTool({
          tag: this.tags[tool.tag],
          datadefRef: this.getDataDefRef(runtimePage.activity)
        });
      }
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      _ref7 = stepdef.responseBranches || [];
      _results = [];
      for (_o = 0, _len7 = _ref7.length; _o < _len7; _o++) {
        response_def = _ref7[_o];
        _results.push(step.appendResponseBranch({
          criterion: response_def.criterion,
          step: this.runtimeStepsByName[response_def.step]
        }));
      }
      return _results;
    };

    SlopeToolSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, color, datadefRef, otherAnnotations, point, runtimeActivity, runtimeStep, stepdef, x_units_abbr, y_units_abbr, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _results;
      this.xUnits = "";
      this.yUnits = "";
      this.in_xUnits = "";
      this.in_yUnits = "";
      this.slope_units = "";
      this.in_slope_units = "";
      if (this.graphPane.yUnits) {
        this.yUnits = " " + (this.graphPane.yUnits.toLowerCase());
        this.xUnits = " " + (this.graphPane.xUnits.toLowerCase());
        this.in_xUnits = " in " + this.xUnits;
        this.in_yUnits = " in " + this.yUnits;
      }
      if (this.graphPane.xUnitsRef) {
        x_units_abbr = this.graphPane.xUnitsRef.unit.abbreviation;
        y_units_abbr = this.graphPane.yUnitsRef.unit.abbreviation;
        this.slope_units = " " + y_units_abbr + "/" + x_units_abbr;
        this.in_slope_units = " in" + this.slope_units;
      }
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.tags = {};
      this.annotations = {};
      this.firstPoint = runtimeActivity.createAndAppendTag();
      this.firstPoint.datadefName = datadefRef.name;
      this.firstPoint.x = this.xMin;
      this.firstPoint.y = this.yMin;
      this.secondPoint = runtimeActivity.createAndAppendTag();
      this.secondPoint.datadefName = datadefRef.name;
      this.secondPoint.x = this.xMax;
      this.secondPoint.y = this.yMax;
      if (!this.studentSelectsPoints) {
        this.firstPoint.x = this.xMin;
        this.firstPoint.y = this.yMin;
        this.secondPoint.x = this.xMax;
        this.secondPoint.y = this.yMax;
      }
      runtimePage.addSlopeVars(this.firstPoint, this.secondPoint, this.precision);
      _ref = [this.firstPoint, this.secondPoint];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        point = _ref[_i];
        color = "#ff7f0e";
        if (this.firstPoint === point) color = "#1f77b4";
        this.tags[point.name] = point;
        this.annotations[point.name] = runtimeActivity.createAndAppendAnnotation({
          type: "HighlightedPoint",
          color: color,
          datadefRef: datadefRef,
          tag: point
        });
      }
      otherAnnotations = [
        {
          name: 'run-arrow',
          type: 'RunArrow'
        }, {
          name: 'rise-arrow',
          type: 'RiseArrow'
        }, {
          name: 'run-bracket',
          type: 'RunBracket'
        }, {
          name: 'rise-bracket',
          type: 'RiseBracket'
        }, {
          name: 'slope-line',
          type: 'LineThroughPoints',
          color: '#1f77b4'
        }
      ];
      for (_j = 0, _len2 = otherAnnotations.length; _j < _len2; _j++) {
        annotation = otherAnnotations[_j];
        this.annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation({
          type: annotation.type,
          namePrefix: annotation.name,
          datadefRef: datadefRef,
          color: annotation.color || '#cccccc',
          p1Tag: this.firstPoint,
          p2Tag: this.secondPoint
        });
      }
      this.assemble_steps();
      _ref2 = this.steps;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref3 = this.steps;
      _results = [];
      for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
        stepdef = _ref3[_l];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        }));
      }
      return _results;
    };

    SlopeToolSequence.prototype.lineAppearsQuestion = function() {
      var _ref;
      if (this.firstQuestionIsSlopeQuestion) return this.firstQuestion;
      return "What was the " + this.slopeVariableName + " between the two points" + ((_ref = this.in_slope_units) != null ? _ref : "") + "?";
    };

    SlopeToolSequence.prototype.first_slope_question = function() {
      return {
        name: "first_slope_question",
        defaultBranch: this.first_slope_default_branch(),
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: this.firstQuestion,
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: [],
        tableAnnotations: [],
        tools: [],
        responseBranches: this.check_correct_slope(false)
      };
    };

    SlopeToolSequence.prototype.select_first_point = function() {
      return {
        name: "select_first_point",
        defaultBranch: "if_first_point_wrong",
        submitButtonTitle: "OK",
        beforeText: this.select_first_point_first_time_text(),
        graphAnnotations: ["" + this.firstPoint.name],
        tableAnnotations: ["" + this.firstPoint.name],
        tools: [
          {
            tag: this.firstPoint.name
          }
        ],
        responseBranches: [this.point_in_range("select_second_point")]
      };
    };

    SlopeToolSequence.prototype.if_first_point_wrong = function() {
      return {
        name: "if_first_point_wrong",
        defaultBranch: "if_first_point_wrong",
        submitButtonTitle: "OK",
        beforeText: this.first_point_wrong_text(),
        graphAnnotations: ["" + this.firstPoint.name],
        tableAnnotations: ["" + this.firstPoint.name],
        tools: [
          {
            tag: this.firstPoint.name
          }
        ],
        responseBranches: [this.point_in_range("select_second_point")]
      };
    };

    SlopeToolSequence.prototype.select_second_point = function() {
      return {
        name: "select_second_point",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: this.select_second_point_text(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.second_point_not_adjacent_and_should_be = function() {
      return {
        name: "second_point_not_adjacent_and_should_be",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: "" + (this.incorrect_text()) + "\n<p> Your points should be adjacent.</p>\n" + (this.select_second_point_text()),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.second_point_duplicate_point = function() {
      return {
        name: "second_point_duplicate_point",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: "" + (this.incorrect_text()) + "\n<p> You have selected the same point twice.</p>\n" + (this.select_second_point_text()),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.second_point_out_of_range = function() {
      return {
        name: "second_point_out_of_range",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: this.second_point_out_of_range_text(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.when_line_appears = function() {
      return {
        name: "when_line_appears",
        defaultBranch: "slope_wrong_0",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p> Here is the line connecting the two points. </p>\n<p> " + (this.lineAppearsQuestion()) + " </p>",
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.slope_wrong_0 = function() {
      return {
        name: "slope_wrong_0",
        defaultBranch: "slope_wrong_ask_for_rise",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "" + (this.incorrect_text()) + "\n<p> " + (this.lineAppearsQuestion()) + " </p>\n<p>Hint: Recall that the " + this.slopeVariableName + " is \nthe change in  " + this.y_axis_name + "\ndivided by the change in " + this.x_axis_name + ".</p>",
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.slope_wrong_ask_for_rise = function() {
      return {
        name: "slope_wrong_ask_for_rise",
        defaultBranch: "if_rise_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "" + (this.incorrect_text()) + "\n<p>What was the change in\n" + this.y_axis_name + " between the two points" + this.in_yUnits + "?</p>\n<p>Hint: Look at the graph.</p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["rise-arrow"],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "y", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_run"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_rise_wrong_1 = function() {
      return {
        name: "if_rise_wrong_1",
        defaultBranch: "if_rise_wrong_2",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "" + (this.incorrect_text()) + "\n<p>What was the change in\n" + this.y_axis_name + " between the two points" + this.in_yUnits + "?</p>\n<p>Hint: Look at the table and the graph.</p>",
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["rise-arrow"],
        highLightedTableAnnotations: ["rise-bracket"],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "y", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_run"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_rise_wrong_2 = function() {
      return {
        name: "if_rise_wrong_2",
        defaultBranch: "ask_for_run",
        submitButtonTitle: "Continue",
        beforeText: "" + (this.incorrect_text()) + "\n<p>The change" + this.in_yUnits + " is\n<b>%@</b> - <b>%@</b>, \nor <b>%@</b>.</p>",
        substitutedExpressions: ["end-y", "start-y", "change-y"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["rise-arrow"],
        highLightedTableAnnotations: ["rise-bracket"]
      };
    };

    SlopeToolSequence.prototype.ask_for_run = function() {
      return {
        name: "ask_for_run",
        defaultBranch: "if_run_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>What was the change in\n" + this.x_axis_name + " between the two points" + this.in_xUnits + "?</p>\n<p>Hint: Look at the graph.</p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["run-arrow"],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "x", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_slope"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_run_wrong_1 = function() {
      return {
        name: "if_run_wrong_1",
        defaultBranch: "if_run_wrong_2",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "" + (this.incorrect_text()) + "\n<p>What was the change in\n" + this.x_axis_name + " between the two points" + this.in_xUnits + "?</p>\n<p>Hint: Look at the graph and the table.</p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["run-arrow"],
        highLightedTableAnnotations: ["run-bracket"],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "x", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_slope"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_run_wrong_2 = function() {
      return {
        name: "if_run_wrong_2",
        defaultBranch: "ask_for_slope",
        submitButtonTitle: "Continue",
        beforeText: "" + (this.incorrect_text()) + "\n<p>The change" + this.in_xUnits + " \nbetween the points is <b>%@</b> - <b>%@</b>, \nor <b>%@</b>.</p>",
        substitutedExpressions: ["end-x", "start-x", "change-x"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["run-arrow"],
        highLightedTableAnnotations: ["run-bracket"]
      };
    };

    SlopeToolSequence.prototype.ask_for_slope = function() {
      return {
        name: "ask_for_slope",
        defaultBranch: "slope_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>\n  If the change in " + this.y_axis_name + " is %@" + this.yUnits + "\n  and the change in " + this.x_axis_name + " is %@" + this.xUnits + "\n  then what is the " + this.slopeVariableName + this.in_slope_units + "?\n</p>",
        substitutedExpressions: ["change-y", "change-x"],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.slope_wrong_1 = function() {
      return {
        name: "slope_wrong_1",
        defaultBranch: "give_up_slope_calculation",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "" + (this.incorrect_text()) + "\n<p>\n  If the change in " + this.y_axis_name + " is %@" + this.yUnits + "\n  and the change in " + this.x_axis_name + " is %@" + this.xUnits + "\n  then what is the " + this.slopeVariableName + this.in_slope_units + "?\n</p>\n<p>\n  Hint: Remember that it is \n  the change in " + this.y_axis_name + " \n  <b>divided by</b> \n  the change in " + this.x_axis_name + ".\n</p>",
        substitutedExpressions: ["change-y", "change-x"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.give_up_slope_calculation = function() {
      return {
        name: "give_up_slope_calculation",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "" + (this.incorrect_text()) + "\n<p>\nIf the change in " + this.y_axis_name + " is %@" + this.yUnits + "\nand the change in " + this.x_axis_name + " is %@" + this.xUnits + ",\nthe " + this.slopeVariableName + " is \n<b>%@</b> divided by <b>%@</b>, \nor <b>%@</b>" + this.slope_units + ".</p>",
        substitutedExpressions: ["change-y", "change-x", "change-y", "change-x", "slope_str"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name]
      };
    };

    SlopeToolSequence.prototype.confirm_correct = function() {
      var subs_expr, the_slope;
      the_slope = "%@";
      subs_expr = ["slope_str"];
      if (this.firstQuestionIsSlopeQuestion) {
        the_slope = this.slope.toFixed(this.precision);
        subs_expr = [];
      }
      return {
        name: "confirm_correct",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<p><b>Correct!</b></p>\n<p>The " + this.slopeVariableName + " is <b>" + the_slope + "</b>" + this.slope_units + ".</p>",
        substitutedExpressions: subs_expr,
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"]
      };
    };

    SlopeToolSequence.prototype.assemble_steps = function() {
      if (this.firstQuestionIsSlopeQuestion) {
        this.steps.push(this.first_slope_question());
      }
      if (this.studentSelectsPoints) {
        this.steps.push(this.select_first_point());
        this.steps.push(this.if_first_point_wrong());
        this.steps.push(this.select_second_point());
        this.steps.push(this.second_point_not_adjacent_and_should_be());
        this.steps.push(this.second_point_duplicate_point());
        this.steps.push(this.second_point_out_of_range());
      }
      this.steps.push(this.when_line_appears());
      this.steps.push(this.slope_wrong_0());
      this.steps.push(this.slope_wrong_ask_for_rise());
      this.steps.push(this.if_rise_wrong_1());
      this.steps.push(this.if_rise_wrong_2());
      this.steps.push(this.ask_for_run());
      this.steps.push(this.if_run_wrong_1());
      this.steps.push(this.if_run_wrong_2());
      this.steps.push(this.ask_for_slope());
      this.steps.push(this.slope_wrong_1());
      this.steps.push(this.give_up_slope_calculation());
      return this.steps.push(this.confirm_correct());
    };

    return SlopeToolSequence;

  })();

}).call(this);

});

require.define("/author/line_construction_sequence.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPane, LineConstructionSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.LineConstructionSequence = LineConstructionSequence = (function() {

    function LineConstructionSequence(_arg) {
      var i, pane, _len, _ref;
      this.slope = _arg.slope, this.dataSetName = _arg.dataSetName, this.slopeTolerance = _arg.slopeTolerance, this.yIntercept = _arg.yIntercept, this.yInterceptTolerance = _arg.yInterceptTolerance, this.initialPrompt = _arg.initialPrompt, this.confirmCorrect = _arg.confirmCorrect, this.slopeIncorrect = _arg.slopeIncorrect, this.yInterceptIncorrect = _arg.yInterceptIncorrect, this.allIncorrect = _arg.allIncorrect, this.giveUp = _arg.giveUp, this.maxAttempts = _arg.maxAttempts, this.page = _arg.page;
      if (this.maxAttempts === 0) {
        throw new Error("Number of attempts should be more than 0");
      }
      this.correctLineDataRef;
      this.correctLineDataDef;
      this.correctLineColor;
      this.correctLineDataSetName = "Correct Line (Page " + this.page.index + ")";
      this.learnerDataSetColor = '#cc0000';
      this.steps = [];
      this.specialSteps = [];
      this.runtimeStepsByName = {};
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor["PredefinedGraphPane"]) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor["TablePane"]) {
          this.tablePane = pane;
        }
      }
      if (!this.graphPane) {
        throw new Error("Line Construction Sequence requires a GraphPane on the page.");
      }
      if (!this.tablePane) {
        throw new Error("Line Construction Sequence requires a TablePane on the page.");
      }
      if (this.dataSetName) this.graphPane.activeDatasetName = this.dataSetName;
      if (!this.maxAttempts) this.maxAttempts = 1;
    }

    LineConstructionSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    LineConstructionSequence.prototype.setupStep = function(_arg) {
      var annotation, datadefRefForStep, hasAnswer, legendsDataset, response_def, runtimePage, step, stepDataDefRef, stepDataRefs, stepIncludedDataSets, stepdef, tool, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef, hasAnswer = _arg.hasAnswer;
      datadefRefForStep = this.graphPane.datadefRef;
      step = this.runtimeStepsByName[stepdef.name];
      stepDataDefRef = [];
      stepIncludedDataSets = [];
      stepDataRefs = [];
      legendsDataset = [this.learnerDataSet];
      if (hasAnswer === "true") {
        stepDataRefs = this.graphPane.datarefs.concat(this.correctLineDataRef);
        stepDataDefRef = datadefRefForStep.concat({
          key: this.correctLineDataSetName,
          datadef: this.correctLineDataDef
        });
        stepIncludedDataSets = this.graphPane.includedDataSets.concat({
          name: this.correctLineDataSetName,
          inLegend: true
        });
        legendsDataset.push(this.correctLineDataSetName);
      } else {
        stepDataRefs = this.graphPane.datarefs ? this.graphPane.datarefs : [];
        stepDataDefRef = datadefRefForStep;
        stepIncludedDataSets = this.graphPane.includedDataSets;
      }
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: stepDataDefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index,
        showCrossHairs: stepdef.showCrossHairs,
        showGraphGrid: stepdef.showGraphGrid,
        showToolTipCoords: stepdef.showToolTipCoords,
        includedDataSets: stepIncludedDataSets,
        activeDatasetName: this.graphPane.activeDatasetName,
        dataref: stepDataRefs
      });
      step.addTablePane({
        datadefRef: this.getDataDefRef(runtimePage.activity),
        index: this.tablePane.index,
        xLabel: this.tablePane.xLabel,
        yLabel: this.tablePane.yLabel
      });
      step.beforeText = stepdef.beforeText;
      step.substitutedExpressions = stepdef.substitutedExpressions;
      step.variableAssignments = stepdef.variableAssignments;
      step.submitButtonTitle = stepdef.submitButtonTitle;
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      step.setSubmissibilityCriterion(stepdef.submissibilityCriterion);
      _ref = stepdef.graphAnnotations || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        annotation = _ref[_i];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref2 = stepdef.tools || [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        tool = _ref2[_j];
        step.addGraphingTool({
          index: this.index || 0,
          datadefRef: this.getDataDefRef(runtimePage.activity),
          annotation: this.annotations["singleLineGraphing"],
          shape: "singleLine"
        });
      }
      _ref3 = stepdef.responseBranches || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        response_def = _ref3[_k];
        step.appendResponseBranch({
          criterion: response_def.criterion,
          step: this.runtimeStepsByName[response_def.step]
        });
      }
      return step;
    };

    LineConstructionSequence.prototype.check_correct_answer = function(nCounter) {
      var criterionArray, nextInterceptCorrect, nextSlopeCorrect;
      criterionArray = [];
      if ((nCounter + 1) < this.maxAttempts) {
        nextSlopeCorrect = 'incorrect_answer_but_slope_correct_after_' + (nCounter + 1) + '_try';
        nextInterceptCorrect = 'incorrect_answer_but_y_intercept_correct_after_' + (nCounter + 1) + '_try';
        criterionArray = [
          {
            "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
            "step": "confirm_correct"
          }, {
            "criterion": ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance],
            "step": nextSlopeCorrect
          }, {
            "criterion": ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance],
            "step": nextInterceptCorrect
          }
        ];
      } else {
        criterionArray = [
          {
            "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
            "step": "confirm_correct"
          }
        ];
      }
      return criterionArray;
    };

    LineConstructionSequence.prototype.check_final_answer = function() {
      return [
        {
          "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
          "step": "confirm_correct"
        }
      ];
    };

    LineConstructionSequence.prototype.get_correctSlopeLine = function(runtimeActivity, graphPane) {
      var NewEmptyData, correctLineExpression, negated_sign_char;
      this.correctLineSlope = this.slope;
      this.correctLineIntercept = this.yIntercept;
      negated_sign_char = this.correctLineIntercept >= 0 ? '+' : '-';
      correctLineExpression = 'y = ' + this.correctLineSlope + 'x' + negated_sign_char + Math.abs(this.correctLineIntercept);
      this.correctLineColor = '#17becf';
      NewEmptyData = runtimeActivity.createNewEmptyDataRef(this.correctLineDataSetName, correctLineExpression, 0.1, 0, this.correctLineColor);
      this.correctLineDataDef = NewEmptyData.datadef;
      this.correctLineDataRef = NewEmptyData.dataref;
      return this.correctLineDataDef;
    };

    LineConstructionSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, otherAnnotations, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      this.get_correctSlopeLine(runtimeActivity, this.graphPane);
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      this.tags = {};
      this.annotations = {};
      otherAnnotations = [
        {
          name: "singleLineGraphing",
          type: "FreehandSketch"
        }
      ];
      for (_i = 0, _len = otherAnnotations.length; _i < _len; _i++) {
        annotation = otherAnnotations[_i];
        this.annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation({
          type: "FreehandSketch"
        });
      }
      this.assemble_steps();
      _ref = this.steps;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        stepdef = _ref[_j];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref2 = this.specialSteps;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref3 = this.steps;
      for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
        stepdef = _ref3[_l];
        this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        });
      }
      _ref4 = this.specialSteps;
      _results = [];
      for (_m = 0, _len5 = _ref4.length; _m < _len5; _m++) {
        stepdef = _ref4[_m];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage,
          hasAnswer: "true"
        }));
      }
      return _results;
    };

    LineConstructionSequence.prototype.first_question = function() {
      return {
        name: "question",
        defaultBranch: this.maxAttempts === 1 ? "attempts_over" : "incorrect_answer_all_after_1_try",
        submitButtonTitle: "Check My Answer",
        beforeText: this.initialPrompt,
        substitutedExpressions: [],
        submissibilityCriterion: ["=", ["lineCount"], 1],
        showCrossHairs: this.graphPane.showCrossHairs,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(0)
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_all_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_all_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_all_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.allIncorrect + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_y_intercept_correct_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_but_y_intercept_correct_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_all_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.slopeIncorrect + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_slope_correct_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_but_slope_correct_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_all_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.yInterceptIncorrect + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    LineConstructionSequence.prototype.attempts_over = function() {
      return {
        name: "attempts_over",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.giveUp + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    LineConstructionSequence.prototype.confirm_correct = function() {
      return {
        name: "confirm_correct",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.confirmCorrect + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    LineConstructionSequence.prototype.assemble_steps = function() {
      var nCounter;
      nCounter = 1;
      this.steps.push(this.first_question());
      while (nCounter < this.maxAttempts) {
        this.steps.push(this.incorrect_answer_all_after_try(nCounter));
        this.steps.push(this.incorrect_answer_but_y_intercept_correct_after_try(nCounter));
        this.steps.push(this.incorrect_answer_but_slope_correct_after_try(nCounter));
        nCounter++;
      }
      this.specialSteps.push(this.attempts_over());
      return this.specialSteps.push(this.confirm_correct());
    };

    return LineConstructionSequence;

  })();

}).call(this);

});

require.define("/author/best_fit_sequence.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPane, BestFitSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.BestFitSequence = BestFitSequence = (function() {

    function BestFitSequence(_arg) {
      var i, pane, _len, _ref;
      this.type = _arg.type, this.dataSetName = _arg.dataSetName, this.learnerDataSet = _arg.learnerDataSet, this.correctTolerance = _arg.correctTolerance, this.closeTolerance = _arg.closeTolerance, this.initialPrompt = _arg.initialPrompt, this.incorrectPrompt = _arg.incorrectPrompt, this.closePrompt = _arg.closePrompt, this.confirmCorrect = _arg.confirmCorrect, this.giveUp = _arg.giveUp, this.maxAttempts = _arg.maxAttempts, this.page = _arg.page;
      if (this.maxAttempts === 0) {
        throw new Error("Number of attempts should be more than 0");
      }
      this.bestFitLineslope = 0;
      this.bestFitLineConstant = 0;
      this.SumofSquares = 0;
      this.bestFitLineDataDef;
      this.bestFitLineDataRef;
      this.bestFitLineColor;
      this.learnerDataSetColor = '#cc0000';
      this.steps = [];
      this.specialSteps = [];
      this.runtimeStepsByName = {};
      this.correctLineDataSetName = "CorrectLine-" + this.page.index;
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor["PredefinedGraphPane"]) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor["TablePane"]) {
          this.tablePane = pane;
        }
      }
      if (this.learnerDataSet) {
        this.graphPane.activeDatasetName = this.learnerDataSet;
      }
      if (!this.maxAttempts) this.maxAttempts = 1;
    }

    BestFitSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    BestFitSequence.prototype.setupStep = function(_arg) {
      var annotation, datadefRefForStep, hasAnswer, legendsDataset, response_def, runtimePage, step, stepDataDefRef, stepDataRefs, stepIncludedDataSets, stepdef, tool, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef, hasAnswer = _arg.hasAnswer;
      datadefRefForStep = this.graphPane.datadefRef;
      step = this.runtimeStepsByName[stepdef.name];
      stepDataDefRef = [];
      stepIncludedDataSets = [];
      stepDataRefs = [];
      legendsDataset = [this.learnerDataSet];
      if (hasAnswer === "true") {
        stepDataRefs = this.graphPane.datarefs.concat(this.bestFitLineDataRef);
        stepDataDefRef = datadefRefForStep.concat({
          key: this.correctLineDataSetName,
          datadef: this.bestFitLineDataDef
        });
        stepIncludedDataSets = this.graphPane.includedDataSets.concat({
          name: this.correctLineDataSetName,
          inLegend: true
        });
        legendsDataset.push(this.correctLineDataSetName);
      } else {
        stepDataRefs = this.graphPane.dataref ? this.graphPane.dataref : [];
        stepDataDefRef = datadefRefForStep;
        stepIncludedDataSets = this.graphPane.includedDataSets;
      }
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: stepDataDefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index,
        showCrossHairs: stepdef.showCrossHairs,
        showGraphGrid: stepdef.showGraphGrid,
        showToolTipCoords: stepdef.showToolTipCoords,
        includedDataSets: stepIncludedDataSets,
        activeDatasetName: this.graphPane.activeDatasetName,
        dataref: stepDataRefs,
        sequenceType: {
          title: "Sum of squares",
          type: "AvgSumOfDeviation",
          referenceDatadef: this.dataSetName,
          legendDataSets: legendsDataset
        }
      });
      step.addTablePane({
        datadefRef: this.getDataDefRef(runtimePage.activity),
        index: this.tablePane.index,
        xLabel: this.tablePane.xLabel,
        yLabel: this.tablePane.yLabel
      });
      step.beforeText = stepdef.beforeText;
      step.substitutedExpressions = stepdef.substitutedExpressions;
      step.variableAssignments = stepdef.variableAssignments;
      step.submitButtonTitle = stepdef.submitButtonTitle;
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      step.setSubmissibilityCriterion(stepdef.submissibilityCriterion);
      _ref = stepdef.graphAnnotations || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        annotation = _ref[_i];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref2 = stepdef.tools || [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        tool = _ref2[_j];
        step.addGraphingTool({
          index: this.index || 0,
          datadefRef: this.getDataDefRef(runtimePage.activity),
          annotation: this.annotations["singleLineGraphing"],
          shape: "singleLine"
        });
      }
      _ref3 = stepdef.responseBranches || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        response_def = _ref3[_k];
        step.appendResponseBranch({
          criterion: response_def.criterion,
          step: this.runtimeStepsByName[response_def.step]
        });
      }
      return step;
    };

    BestFitSequence.prototype.check_correct_answer = function(nCounter) {
      var closeTolerance, correctTolerance, criterionArray, nextCloseCorrect;
      criterionArray = [];
      correctTolerance = this.SumofSquares * this.correctTolerance / 100;
      closeTolerance = this.SumofSquares * this.closeTolerance / 100;
      if ((nCounter + 1) < this.maxAttempts) {
        nextCloseCorrect = 'close_answer_after_' + (nCounter + 1) + '_try';
        criterionArray = [
          {
            "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], correctTolerance],
            "step": 'correct_answer'
          }, {
            "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], closeTolerance],
            "step": nextCloseCorrect
          }
        ];
      } else {
        criterionArray = [
          {
            "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], correctTolerance],
            "step": 'correct_answer'
          }
        ];
      }
      return criterionArray;
    };

    BestFitSequence.prototype.check_final_answer = function() {
      return [
        {
          "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], correctTolerance],
          "step": 'correct_answer'
        }
      ];
    };

    BestFitSequence.prototype.get_bestFitLine = function(runtimeActivity, graphPane) {
      var NewEmptyData, bestFitLineExpression, dataPointSet, dataSet, ditanceOfPointFromBestFitLine, i, j, negated_sign_char, numPoints, point, productOfXDiffYDiff, scaleFactor, squareOfXDifference, sumOfX, sumOfY, xDifference, xMean, yDifference, yMean;
      dataPointSet = runtimeActivity.getDatadefRef("" + this.dataSetName);
      dataSet = dataPointSet.datadef.points;
      if (!(dataSet.length && dataSet.length > 5)) {
        throw new Error("Not valid Dataset !!!!");
      }
      this.bestFitLineslope = 0;
      this.bestFitLineConstant = 0;
      sumOfX = 0;
      sumOfY = 0;
      numPoints = dataSet.length;
      xDifference = 0;
      yDifference = 0;
      xMean = 0;
      yMean = 0;
      squareOfXDifference = 0;
      i = 0;
      scaleFactor = 10000;
      while (i < numPoints) {
        point = dataSet[i];
        sumOfX += point[0] * scaleFactor;
        sumOfY += point[1] * scaleFactor;
        i++;
      }
      xMean = sumOfX / numPoints;
      yMean = sumOfY / numPoints;
      i = 0;
      productOfXDiffYDiff = 0;
      while (i < numPoints) {
        point = dataSet[i];
        xDifference = (point[0] * scaleFactor) - xMean;
        yDifference = (point[1] * scaleFactor) - yMean;
        productOfXDiffYDiff += xDifference * yDifference;
        squareOfXDifference += xDifference * xDifference;
        i++;
      }
      this.bestFitLineslope = productOfXDiffYDiff / squareOfXDifference;
      if (this.bestFitLineslope === Infinity || this.bestFitLineslope === -Infinity || isNaN(this.bestFitLineslope)) {
        throw new Error("Invalid scatter-plot");
      }
      this.bestFitLineConstant = (yMean - (this.bestFitLineslope * xMean)) / scaleFactor;
      this.SumofSquares = 0;
      j = 0;
      while (j < numPoints) {
        point = dataSet[j];
        ditanceOfPointFromBestFitLine = Math.abs((this.bestFitLineslope * point[0]) - point[1] + this.bestFitLineConstant);
        this.SumofSquares += ditanceOfPointFromBestFitLine * ditanceOfPointFromBestFitLine;
        j++;
      }
      negated_sign_char = this.bestFitLineConstant >= 0 ? '+' : '-';
      bestFitLineExpression = 'y = ' + this.bestFitLineslope + 'x' + negated_sign_char + Math.abs(this.bestFitLineConstant);
      this.bestFitLineColor = runtimeActivity.getNewColor();
      NewEmptyData = runtimeActivity.createNewEmptyDataRef(this.correctLineDataSetName, bestFitLineExpression, 0.1, 0, this.bestFitLineColor);
      this.bestFitLineDataDef = NewEmptyData.datadef;
      this.bestFitLineDataRef = NewEmptyData.dataref;
      runtimeActivity.setColorOfDatadef(this.dataSetName, this.bestFitLineColor);
      runtimeActivity.setColorOfDatadef(this.learnerDataSet, this.learnerDataSetColor);
      return this.bestFitLineDataDef;
    };

    BestFitSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, otherAnnotations, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      this.get_bestFitLine(runtimeActivity, this.graphPane);
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      this.tags = {};
      this.annotations = {};
      otherAnnotations = [
        {
          name: "singleLineGraphing",
          type: "FreehandSketch"
        }
      ];
      for (_i = 0, _len = otherAnnotations.length; _i < _len; _i++) {
        annotation = otherAnnotations[_i];
        this.annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation({
          type: "FreehandSketch"
        });
      }
      this.assemble_steps();
      _ref = this.steps;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        stepdef = _ref[_j];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref2 = this.specialSteps;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref3 = this.steps;
      for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
        stepdef = _ref3[_l];
        this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        });
      }
      _ref4 = this.specialSteps;
      _results = [];
      for (_m = 0, _len5 = _ref4.length; _m < _len5; _m++) {
        stepdef = _ref4[_m];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage,
          hasAnswer: "true"
        }));
      }
      return _results;
    };

    BestFitSequence.prototype.first_question = function() {
      return {
        name: "first_question",
        defaultBranch: this.maxAttempts === 1 ? "attempts_over" : "incorrect_answer_after_1_try",
        submitButtonTitle: "Check My Answer",
        beforeText: this.initialPrompt,
        substitutedExpressions: [],
        submissibilityCriterion: ["=", ["lineCount"], 1],
        showCrossHairs: this.graphPane.showCrossHairs,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(0)
      };
    };

    BestFitSequence.prototype.incorrect_answer_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.incorrectPrompt + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    BestFitSequence.prototype.close_answer_after_try = function(nCounter) {
      return {
        name: "close_answer_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.closePrompt + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    BestFitSequence.prototype.attempts_over = function() {
      return {
        name: "attempts_over",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.giveUp + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    BestFitSequence.prototype.correct_answer = function() {
      return {
        name: "correct_answer",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.confirmCorrect + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    BestFitSequence.prototype.assemble_steps = function() {
      var nCounter;
      nCounter = 1;
      this.steps.push(this.first_question());
      while (nCounter < this.maxAttempts) {
        this.steps.push(this.incorrect_answer_after_try(nCounter));
        this.steps.push(this.close_answer_after_try(nCounter));
        nCounter++;
      }
      this.specialSteps.push(this.attempts_over());
      return this.specialSteps.push(this.correct_answer());
    };

    return BestFitSequence;

  })();

}).call(this);

});

require.define("/author/label_sequence.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPane, LabelSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.LabelSequence = LabelSequence = (function() {

    function LabelSequence(_arg) {
      var i, pane, _len, _ref;
      this.type = _arg.type, this.text = _arg.text, this.labelSetName = _arg.labelSetName, this.numberOfLabels = _arg.numberOfLabels, this.dataset = _arg.dataset, this.page = _arg.page;
      if (!this.numberOfLabels) this.numberOfLabels = 1;
      this.anyLabel = this.dataset ? true : false;
      this.steps = [];
      this.runtimeStepsByName = {};
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor["PredefinedGraphPane"]) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor["TablePane"]) {
          this.tablePane = pane;
        }
      }
    }

    LabelSequence.prototype.appendSteps = function(runtimePage) {
      var datadefRef, pane, runtimeActivity, step, _i, _len, _ref;
      runtimeActivity = runtimePage.activity;
      step = runtimePage.appendStep();
      step.setBeforeText(this.text);
      step.setSubmissibilityCriterion(["=", ["numberOfLabels", this.labelSetName], this.numberOfLabels], step.setSubmissibilityDependsOn(["annotation", this.labelSetName]));
      _ref = this.page.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToStep(step);
      }
      if (this.dataset) {
        datadefRef = runtimeActivity.getDatadefRef(this.dataset);
        step.addLabelTool({
          labelSetName: this.labelSetName,
          index: this.graphPane.index,
          datadefRef: datadefRef,
          markOnDataPoints: true,
          maxNoOfLabels: this.numberOfLabels,
          allowCoordinatesChange: false
        });
      } else {
        step.addLabelTool({
          labelSetName: this.labelSetName,
          index: this.graphPane.index,
          markOnDataPoints: false,
          maxNoOfLabels: this.numberOfLabels,
          allowCoordinatesChange: true
        });
      }
      if (this.labelSetName) {
        this.labelSetObject = runtimeActivity.createAndAppendAnnotation({
          type: 'LabelSet',
          name: this.labelSetName
        });
        return step.addAnnotationToPane({
          annotation: this.labelSetObject,
          index: this.graphPane.index
        });
      }
    };

    return LabelSequence;

  })();

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

require.define("/author/animation.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Animation, AnimationTool;

  AnimationTool = require('../runtime/animation-tool').AnimationTool;

  exports.Animation = Animation = (function() {

    function Animation(_arg, activity) {
      this.name = _arg.name, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.markedCoordinates = _arg.markedCoordinates, this.dataset = _arg.dataset;
      this.activity = activity;
      if (this.markedCoodinates == null) this.markedCoodinates = [];
      if (this.linkedAnimations == null) this.linkedAnimations = [];
    }

    Animation.prototype.getXMin = function() {
      var dataset;
      console.warn("Please don't call Animation.getXMin; the value should be in the semantic JSON.");
      dataset = this.activity.datasetsByName[this.dataset];
      return dataset.data[0][0];
    };

    Animation.prototype.getXMax = function() {
      var dataset;
      console.warn("Please don't call Animation.getXMax; the value should be in the semantic JSON.");
      dataset = this.activity.datasetsByName[this.dataset];
      return dataset.data[dataset.data.length - 1][0];
    };

    Animation.prototype.addLinkedAnimation = function(_arg) {
      this.pane = _arg.pane, this.datasets = _arg.datasets;
      return this.linkedAnimations.push({
        pane: this.pane,
        datasets: this.datasets
      });
    };

    Animation.prototype.toAnimationTool = function() {
      return new AnimationTool({
        datasetName: this.dataset,
        staticImageYValues: this.markedCoordinates,
        linkedAnimations: this.linkedAnimations
      });
    };

    return Animation;

  })();

}).call(this);

});

require.define("/runtime/animation-tool.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AnimationTool;

  exports.AnimationTool = AnimationTool = (function() {

    AnimationTool.prototype.index = null;

    AnimationTool.prototype.panes = null;

    AnimationTool.prototype.hideGraph = false;

    function AnimationTool(_arg) {
      this.datasetName = _arg.datasetName, this.staticImageYValues = _arg.staticImageYValues, this.linkedAnimations = _arg.linkedAnimations;
    }

    AnimationTool.prototype.toHash = function() {
      var dataset, la, y;
      return {
        name: "animation",
        setup: {
          pane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
          hideGraph: this.hideGraph,
          duration: 9000,
          channelWidth: 70,
          staticImages: [
            {
              name: "finish",
              image: "finish.png",
              width: 70,
              height: 10,
              xOffset: 0,
              yOffset: 5,
              instances: (function() {
                var _i, _len, _ref, _results;
                _ref = this.staticImageYValues;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  y = _ref[_i];
                  _results.push({
                    y: y
                  });
                }
                return _results;
              }).call(this)
            }
          ],
          backgroundImage: "road-dashed.png",
          animations: [
            {
              data: this.datasetName,
              image: "carWhite2.png",
              width: 30,
              height: 61,
              xOffset: 40,
              yOffset: 0
            }
          ],
          linkedAnimations: (function() {
            var _i, _len, _ref, _results;
            _ref = this.linkedAnimations;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              la = _ref[_i];
              _results.push({
                pane: this.panes.length === 1 ? 'single' : la.pane === 0 ? 'top' : 'bottom',
                animations: (function() {
                  var _j, _len2, _ref2, _results2;
                  _ref2 = la.datasets;
                  _results2 = [];
                  for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                    dataset = _ref2[_j];
                    _results2.push({
                      data: dataset.name
                    });
                  }
                  return _results2;
                })()
              });
            }
            return _results;
          }).call(this)
        }
      };
    };

    return AnimationTool;

  })();

}).call(this);

});

require.define("/runtime/runtime-activity.js", function (require, module, exports, __dirname, __filename) {
    
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

(function() {
  var Annotation, AnnotationCollection, Axis, DataRef, Datadef, HighlightedPoint, ResponseTemplateCollection, RuntimeActivity, RuntimePage, RuntimeUnit, SegmentOverlay, Step, Tag, expressionParser, slugify, _ref,
    __hasProp = Object.prototype.hasOwnProperty;

  slugify = require('../slugify').slugify;

  RuntimePage = require('./runtime-page').RuntimePage;

  Step = require('./step').Step;

  Axis = require('./axis').Axis;

  RuntimeUnit = require('./runtime-unit').RuntimeUnit;

  Datadef = require('./datadef').Datadef;

  DataRef = require('./dataref').DataRef;

  Tag = require('./tag').Tag;

  expressionParser = require('../author/expressionParser').expressionParser;

  _ref = require('./annotations'), AnnotationCollection = _ref.AnnotationCollection, Annotation = _ref.Annotation, HighlightedPoint = _ref.HighlightedPoint, SegmentOverlay = _ref.SegmentOverlay;

  ResponseTemplateCollection = require('./response-templates').ResponseTemplateCollection;

  exports.RuntimeActivity = RuntimeActivity = (function() {

    function RuntimeActivity(owner, name, authorName, datasets, labelSets) {
      this.owner = owner;
      this.name = name;
      this.authorName = authorName;
      this.datasets = datasets;
      this.labelSets = labelSets;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefRefs = {};
      this.nDatadefs = 0;
      this.datarefRefs = {};
      this.nDatarefs = 0;
      this.annotations = {};
      this.annotationCounts = {};
      this.tags = [];
      this.nTags = 0;
      this.responseTemplates = {};
      this.responseTemplatesCounts = {};
      this.referenceDatadef;
      this.dataSetColors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
      this.colorIndex = this.dataSetColors.length - 1;
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

    RuntimeActivity.prototype.createDatadef = function(hash) {
      var datadef;
      hash.index = ++this.nDatadefs;
      datadef = new Datadef(hash);
      datadef.activity = this;
      datadef.populateSourceDatasets();
      datadef.constructUnitRefs();
      return datadef;
    };

    RuntimeActivity.prototype.createDataref = function(_arg) {
      var angularFunction, datadefName, dataref, expression, expressionForm, expressionType, index, lineSnapDistance, name, params, xInterval;
      datadefName = _arg.datadefName, expressionType = _arg.expressionType, expressionForm = _arg.expressionForm, expression = _arg.expression, angularFunction = _arg.angularFunction, xInterval = _arg.xInterval, params = _arg.params, index = _arg.index, lineSnapDistance = _arg.lineSnapDistance, name = _arg.name;
      dataref = new DataRef({
        datadefName: datadefName,
        expressionType: expressionType,
        expressionForm: expressionForm,
        expression: expression,
        angularFunction: angularFunction,
        xInterval: xInterval,
        params: params,
        index: ++this.nDatarefs,
        lineSnapDistance: lineSnapDistance,
        name: name
      });
      dataref.activity = this;
      return dataref;
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
      if (ref.unit != null) throw new Error("Redefinition of unit " + key);
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

    RuntimeActivity.prototype.hasDatadef = function(key) {
      return this.datadefRefs[key] != null;
    };

    RuntimeActivity.prototype.getDatarefRef = function(key) {
      var ref;
      if (ref = this.datarefRefs[key]) {
        return ref;
      } else {
        ref = this.datarefRefs[key] = {
          key: key,
          dataref: null
        };
      }
      return ref;
    };

    RuntimeActivity.prototype.hasDataref = function(key) {
      return this.datarefRefs[key] != null;
    };

    RuntimeActivity.prototype.defineDatadef = function(key, hash) {
      var ref;
      ref = this.getDatadefRef(key);
      if (ref.datadef == null) ref.datadef = this.createDatadef(hash);
      return ref.datadef;
    };

    RuntimeActivity.prototype.defineDataref = function(key, hash) {
      var ref;
      ref = this.getDatarefRef(key);
      if (ref.dataref == null) ref.dataref = this.createDataref(hash);
      return ref.dataref;
    };

    RuntimeActivity.prototype.populateDataSet = function(includedDataSets) {
      var activeDataSetIndex, datadef, dataref, datasetEntry, datasetObject, expressionData, populatedDataDefs, populatedDataRefs, _i, _j, _len, _len2, _ref2;
      populatedDataDefs = [];
      populatedDataRefs = [];
      activeDataSetIndex = 0;
      for (_i = 0, _len = includedDataSets.length; _i < _len; _i++) {
        datasetEntry = includedDataSets[_i];
        _ref2 = this.datasets;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          datasetObject = _ref2[_j];
          if (datasetObject.name === datasetEntry.name) {
            if (String(datasetObject.type).toLowerCase() === "datadef") {
              datadef = this.getDatadefRef(datasetObject.name).datadef;
              if (!(datadef != null)) {
                datadef = this.defineDatadef(datasetObject.name, {
                  points: datasetObject.data,
                  xUnits: datasetObject.xUnits,
                  yUnits: datasetObject.yUnits,
                  lineType: datasetObject.lineType,
                  pointType: datasetObject.pointType,
                  lineSnapDistance: datasetObject.lineSnapDistance,
                  name: datasetObject.name,
                  derivativeOf: datasetObject.derivativeOf,
                  piecewiseLinear: datasetObject.piecewiseLinear
                });
              }
              populatedDataDefs.push(datadef);
            } else if (String(datasetObject.type).toLowerCase() === "dataref") {
              this.expression = datasetObject.expression;
              if (this.expression !== null && this.expression !== void 0) {
                expressionData = expressionParser.parseExpression(this.expression);
                if ((expressionData.type != null) && expressionData.type !== "not supported") {
                  datadef = this.getDatadefRef(datasetObject.name).datadef;
                  if (datadef != null) {
                    dataref = this.getDatarefRef(datasetObject.name).dataref;
                  } else {
                    datadef = this.defineDatadef(datasetObject.name, {
                      points: [],
                      xUnits: datasetObject.xUnits,
                      yUnits: datasetObject.yUnits,
                      lineType: datasetObject.lineType,
                      lineSnapDistance: datasetObject.lineSnapDistance,
                      pointType: datasetObject.pointType,
                      name: datasetObject.name
                    });
                    dataref = this.defineDataref(datasetObject.name, {
                      datadefName: datadef.name,
                      expressionType: expressionData.type,
                      xInterval: datasetObject.xPrecision,
                      expressionForm: expressionData.form,
                      expression: datasetObject.expression,
                      angularFunction: expressionData.angularFunction,
                      params: expressionData.params,
                      lineSnapDistance: datasetObject.lineSnapDistance
                    });
                  }
                  populatedDataDefs.push(datadef);
                  populatedDataRefs.push(dataref);
                }
              }
            }
          }
        }
      }
      this.referenceDatadef = datadef;
      return {
        datadefs: populatedDataDefs,
        datarefs: populatedDataRefs
      };
    };

    RuntimeActivity.prototype.createNewEmptyDataRef = function(name, expression, xPrecision, lineSnapDistance, color) {
      var datadef, dataref, expressionData;
      if (expression !== null && expression !== void 0) {
        expressionData = expressionParser.parseExpression(expression);
        if ((expressionData.type != null) && expressionData.type !== "not supported") {
          if (!(datadef = this.getDatadefRef(name).datadef)) {
            datadef = this.defineDatadef(name, {
              points: [],
              xUnits: this.referenceDatadef.xUnits,
              yUnits: this.referenceDatadef.yUnits,
              lineType: 'connected',
              pointType: 'none',
              lineSnapDistance: this.referenceDatadef.lineSnapDistance,
              name: name,
              color: color
            });
            dataref = this.defineDataref(name, {
              datadefName: datadef.name,
              expressionType: expressionData.type,
              xInterval: xPrecision,
              expressionForm: expressionData.form,
              expression: expression,
              angularFunction: expressionData.angularFunction,
              params: expressionData.params,
              lineSnapDistance: lineSnapDistance
            });
          } else {
            dataref = this.getDatarefRef(datasetObject.name).dataref;
          }
          return {
            datadef: datadef,
            dataref: dataref
          };
        }
      }
    };

    RuntimeActivity.prototype.getNewColor = function() {
      if (!(this.colorIndex <= 0)) {
        return this.dataSetColors[this.colorIndex--];
      } else {
        throw new Error("No new color available.");
      }
    };

    RuntimeActivity.prototype.setColorOfDatadef = function(datadefName, color) {
      var datadef;
      if (datadef = this.getDatadefRef(datadefName).datadef) {
        return datadef.setColor(color);
      }
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

    RuntimeActivity.prototype.createAndAppendAnnotation = function(hash) {
      var AnnotationClass, annotation, createdAnnotation, type, _base, _base2, _i, _len, _ref2;
      type = hash.type;
      if (this.annotations[type]) {
        _ref2 = this.annotations[type];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          createdAnnotation = _ref2[_i];
          if (createdAnnotation.name === hash.name) return createdAnnotation;
        }
      }
      AnnotationClass = AnnotationCollection.classFor[type];
      if ((_base = this.annotationCounts)[type] == null) _base[type] = 0;
      hash.index = ++this.annotationCounts[type];
      annotation = new AnnotationClass(hash);
      annotation.activity = this;
      if ((_base2 = this.annotations)[type] == null) _base2[type] = [];
      this.annotations[type].push(annotation);
      return annotation;
    };

    RuntimeActivity.prototype.createAndAppendResponseTemplate = function(type, initialValues, choices) {
      var TemplateClass, count, key, responseTemplate, _base;
      if (initialValues == null) initialValues = [""];
      TemplateClass = ResponseTemplateCollection.classFor[type];
      key = TemplateClass.getUniqueKey(initialValues, choices);
      if (this.responseTemplates[key]) return this.responseTemplates[key];
      if ((_base = this.responseTemplatesCounts)[type] == null) _base[type] = 0;
      count = ++this.responseTemplatesCounts[type];
      this.responseTemplates[key] = responseTemplate = new TemplateClass(count, initialValues, choices);
      responseTemplate.activity = this;
      return responseTemplate;
    };

    RuntimeActivity.prototype.appendPage = function(page) {
      this.pages.push(page);
      page.setIndex(this.pages.length);
      return page;
    };

    RuntimeActivity.prototype.toHash = function() {
      var flatten, i, key, page, step, tag, template, url;
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
          }).call(this),
          authorName: this.authorName
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
        responseTemplates: (function() {
          var _ref2, _results;
          _ref2 = this.responseTemplates;
          _results = [];
          for (i in _ref2) {
            if (!__hasProp.call(_ref2, i)) continue;
            template = _ref2[i];
            _results.push(template.toHash());
          }
          return _results;
        }).call(this),
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
        datarefs: this.nDatarefs !== 0 ? DataRef.serializeDataRefs(this.datarefRefs) : void 0,
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
  var ContextVar, RuntimePage, slugify;

  slugify = require('../slugify').slugify;

  ContextVar = require('./context-var').ContextVar;

  exports.RuntimePage = RuntimePage = (function() {

    function RuntimePage() {
      this.steps = [];
      this.contextVars = [];
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
      var step, variable, _ref;
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
        firstStep: (_ref = this.steps[0]) != null ? _ref.getUrl() : void 0,
        contextVars: (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.contextVars;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            variable = _ref2[_i];
            _results.push(variable.toHash());
          }
          return _results;
        }).call(this)
      };
    };

    RuntimePage.prototype.addContextVar = function(contextVar) {
      return this.contextVars.push(contextVar);
    };

    RuntimePage.prototype.addNewContextVar = function(definition) {
      return this.addContextVar(new ContextVar(definition));
    };

    RuntimePage.prototype.addSlopeVars = function(pointA, pointB, tolerance) {
      var definition, _i, _len, _ref, _results;
      if (tolerance == null) tolerance = 2;
      _ref = this.slopeVarDefs(pointA, pointB, tolerance);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        definition = _ref[_i];
        _results.push(this.addNewContextVar(definition));
      }
      return _results;
    };

    RuntimePage.prototype.slopeVarDefs = function(pointA, pointB, tolerance) {
      if (tolerance == null) tolerance = 2;
      return [
        {
          "name": "start-y",
          "value": ["coord", "y", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]]
        }, {
          "name": "start-y_str",
          "value": ["toFixedString", ["get", "start-y"], tolerance]
        }, {
          "name": "end-y",
          "value": ["coord", "y", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]]
        }, {
          "name": "end-y_str",
          "value": ["toFixedString", ["get", "end-y"], tolerance]
        }, {
          "name": "change-y",
          "value": ["-", ["get", "end-y"], ["get", "start-y"]]
        }, {
          "name": "change-y_str",
          "value": ["toFixedString", ["get", "change-y"], tolerance]
        }, {
          "name": "start-x",
          "value": ["coord", "x", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]]
        }, {
          "name": "start-x_str",
          "value": ["toFixedString", ["get", "start-x"], tolerance]
        }, {
          "name": "end-x",
          "value": ["coord", "x", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]]
        }, {
          "name": "end-x_str",
          "value": ["toFixedString", ["get", "end-x"], tolerance]
        }, {
          "name": "change-x",
          "value": ["-", ["get", "end-x"], ["get", "start-x"]]
        }, {
          "name": "change-x_str",
          "value": ["toFixedString", ["get", "change-x"], tolerance]
        }, {
          "name": "slope",
          "value": ["/", ["get", "change-y"], ["get", "change-x"]]
        }, {
          "name": "slope_str",
          "value": ["toFixedString", ["get", "slope"], tolerance]
        }
      ];
    };

    return RuntimePage;

  })();

}).call(this);

});

require.define("/runtime/context-var.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var ContextVar;

  exports.ContextVar = ContextVar = (function() {

    function ContextVar(_arg) {
      this.name = _arg.name, this.value = _arg.value;
    }

    ContextVar.prototype.toHash = function() {
      return {
        name: this.name,
        value: this.value
      };
    };

    return ContextVar;

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

    Step.prototype.setSubmissibilityCriterion = function(submissibilityCriterion) {
      this.submissibilityCriterion = submissibilityCriterion;
    };

    Step.prototype.setSubmissibilityDependsOn = function(submissibilityDependsOn) {
      this.submissibilityDependsOn = submissibilityDependsOn;
    };

    Step.prototype.setResponseTemplate = function(responseTemplate) {
      this.responseTemplate = responseTemplate;
    };

    Step.prototype.getUrl = function() {
      return "" + (this.page.getUrl()) + "/step/" + this.index;
    };

    Step.prototype.addImagePane = function(_arg) {
      var attribution, index, license, show_full_image, url;
      url = _arg.url, license = _arg.license, attribution = _arg.attribution, show_full_image = _arg.show_full_image, index = _arg.index;
      return this.panes[index] = {
        url: url,
        license: license,
        attribution: attribution,
        show_full_image: show_full_image,
        toHash: function() {
          return {
            type: 'image',
            path: this.url,
            caption: "" + this.license + " " + this.attribution,
            showFullImage: this.show_full_image
          };
        }
      };
    };

    Step.prototype.addGraphPane = function(_arg) {
      var activeDatasetName, datadefRef, dataref, includedDataSets, index, sequenceType, showCrossHairs, showGraphGrid, showToolTipCoords, title, xAxis, yAxis;
      title = _arg.title, datadefRef = _arg.datadefRef, xAxis = _arg.xAxis, yAxis = _arg.yAxis, index = _arg.index, showCrossHairs = _arg.showCrossHairs, showGraphGrid = _arg.showGraphGrid, showToolTipCoords = _arg.showToolTipCoords, includedDataSets = _arg.includedDataSets, activeDatasetName = _arg.activeDatasetName, dataref = _arg.dataref, sequenceType = _arg.sequenceType;
      return this.panes[index] = {
        title: title,
        datadefRef: datadefRef,
        dataref: dataref ? dataref : [],
        xAxis: xAxis,
        yAxis: yAxis,
        showCrossHairs: showCrossHairs,
        showGraphGrid: showGraphGrid,
        showToolTipCoords: showToolTipCoords,
        annotations: [],
        highlightedAnnotations: [],
        includedDataSets: includedDataSets,
        activeDatasetName: activeDatasetName,
        toHash: function() {
          var annotation, datadefref, dataref, _ref, _ref2, _ref3;
          return {
            type: 'graph',
            title: this.title,
            xAxis: this.xAxis.getUrl(),
            yAxis: this.yAxis.getUrl(),
            showCrossHairs: (_ref = this.showCrossHairs) != null ? _ref : void 0,
            showGraphGrid: (_ref2 = this.showGraphGrid) != null ? _ref2 : void 0,
            showToolTipCoords: (_ref3 = this.showToolTipCoords) != null ? _ref3 : void 0,
            annotations: (function() {
              var _i, _len, _ref4, _results;
              _ref4 = this.annotations;
              _results = [];
              for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                annotation = _ref4[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this),
            highlightedAnnotations: (function() {
              var _i, _len, _ref4, _results;
              _ref4 = this.highlightedAnnotations;
              _results = [];
              for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                annotation = _ref4[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this),
            data: (function() {
              var _i, _len, _ref4, _results;
              if (this.datadefRef.length === 0) {
                return [];
              } else {
                _ref4 = this.datadefRef;
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  datadefref = _ref4[_i];
                  _results.push(datadefref.datadef.name);
                }
                return _results;
              }
            }).call(this),
            datarefs: (function() {
              var _i, _len, _ref4, _results;
              if (this.dataref.length === 0) {
                return;
              } else {
                _ref4 = this.dataref;
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  dataref = _ref4[_i];
                  _results.push(dataref.name);
                }
                return _results;
              }
            }).call(this),
            legends: this.GetLegends(),
            activeDatadefs: this.GetActiveDatasetNames()
          };
        },
        GetActiveDatasetNames: function() {
          if (this.activeDatasetName) return [this.activeDatasetName];
        },
        GetLegends: function() {
          var datadefRef, dataset, oLegendObject, oLegends, referenceDatadef, type, _i, _j, _len, _len2, _ref, _ref2;
          if (this.includedDataSets.length !== 0) {
            title = "legend";
            referenceDatadef = "";
            type = "name";
            oLegendObject = new Object();
            oLegends = new Array();
            if (sequenceType) {
              title = sequenceType.title;
              type = sequenceType.type;
              referenceDatadef = sequenceType.referenceDatadef;
              oLegends = sequenceType.legendDataSets;
            } else {
              _ref = this.includedDataSets;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                dataset = _ref[_i];
                if (dataset.inLegend) {
                  _ref2 = this.datadefRef;
                  for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                    datadefRef = _ref2[_j];
                    if (datadefRef.datadef.name === dataset.name) {
                      oLegends.push(dataset.name);
                      break;
                    }
                  }
                }
              }
            }
            oLegendObject.title = title;
            oLegendObject.type = type;
            oLegendObject.referenceDatadef = referenceDatadef;
            oLegendObject.datadefs = oLegends;
            return oLegendObject;
          }
        }
      };
    };

    Step.prototype.addTablePane = function(_arg) {
      var datadefRef, index, xLabel, yLabel;
      datadefRef = _arg.datadefRef, index = _arg.index, xLabel = _arg.xLabel, yLabel = _arg.yLabel;
      return this.panes[index] = {
        datadefRef: datadefRef,
        annotations: [],
        highlightedAnnotations: [],
        toHash: function() {
          var annotation;
          if (!this.datadefRef.datadef) {
            throw new Error("DataTable requires a data reference, usually from Graph on same page.");
          }
          return {
            type: 'table',
            data: this.datadefRef.datadef.name,
            xLabel: xLabel,
            yLabel: yLabel,
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
            highlightedAnnotations: (function() {
              var _i, _len, _ref, _results;
              _ref = this.highlightedAnnotations;
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

    Step.prototype.addEmptyPane = function(_arg) {
      var index;
      index = _arg.index;
      return this.panes[index] = {
        toHash: function() {
          return;
        }
      };
    };

    Step.prototype.addAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].annotations.push(annotation);
    };

    Step.prototype.addHighlightedAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].highlightedAnnotations.push(annotation);
    };

    Step.prototype.addTaggingTool = function(_arg) {
      var datadefRef, labelName, tag;
      tag = _arg.tag, datadefRef = _arg.datadefRef, labelName = _arg.labelName;
      return this.tools['tagging'] = {
        tag: tag,
        datadefRef: datadefRef,
        labelName: labelName,
        toHash: function() {
          return {
            name: 'tagging',
            setup: {
              tag: this.tag.name,
              data: this.datadefRef.datadef.name,
              labelName: this.labelName
            }
          };
        }
      };
    };

    Step.prototype.addLabelTool = function(_arg) {
      var allowCoordinatesChange, datadefRef, index, labelName, labelSetName, markOnDataPoints, maxNoOfLabels;
      labelName = _arg.labelName, labelSetName = _arg.labelSetName, index = _arg.index, datadefRef = _arg.datadefRef, markOnDataPoints = _arg.markOnDataPoints, maxNoOfLabels = _arg.maxNoOfLabels, allowCoordinatesChange = _arg.allowCoordinatesChange;
      return this.tools['label'] = {
        pane: this.panes.length === 1 ? 'single' : index === 0 ? 'top' : 'bottom',
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'label',
            setup: {
              pane: this.pane,
              labelName: labelName,
              labelSetName: labelSetName,
              markOnDataPoints: markOnDataPoints,
              datadefName: this.datadefRef ? this.datadefRef.datadef.name : void 0,
              allowCoordinatesChange: allowCoordinatesChange,
              maxNoOfLabels: maxNoOfLabels
            }
          };
        }
      };
    };

    Step.prototype.addSensorTool = function(_arg) {
      var datadefRef, index;
      index = _arg.index, datadefRef = _arg.datadefRef;
      return this.tools['sensor'] = {
        index: index,
        panes: this.panes,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'sensor',
            setup: {
              controlsPane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
              data: this.datadefRef.datadef.name
            }
          };
        }
      };
    };

    Step.prototype.addPredictionTool = function(_arg) {
      var annotation, datadefRef, index, uiBehavior;
      index = _arg.index, datadefRef = _arg.datadefRef, annotation = _arg.annotation, uiBehavior = _arg.uiBehavior;
      return this.tools['prediction'] = {
        index: index,
        panes: this.panes,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'prediction',
            setup: {
              pane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
              uiBehavior: uiBehavior,
              annotationName: annotation.name
            }
          };
        }
      };
    };

    Step.prototype.addGraphingTool = function(_arg) {
      var annotation, datadefRef, index, shape;
      index = _arg.index, datadefRef = _arg.datadefRef, annotation = _arg.annotation, shape = _arg.shape;
      return this.tools['graphing'] = {
        index: index,
        panes: this.panes,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'graphing',
            setup: {
              pane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
              shape: shape,
              annotationName: annotation.name,
              data: this.datadefRef.datadef.name
            }
          };
        }
      };
    };

    Step.prototype.addAnimationTool = function(_arg) {
      var animation, hideGraph, index;
      index = _arg.index, animation = _arg.animation, hideGraph = _arg.hideGraph;
      this.tools.animation = animation.toAnimationTool();
      this.tools.animation.hideGraph = hideGraph;
      this.tools.animation.index = index;
      return this.tools.animation.panes = this.panes;
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

    Step.prototype.makeNonFinal = function() {
      if (this.submitButtonTitle == null) this.submitButtonTitle = "OK";
      this.isFinalStep = false;
      return delete this.nextButtonShouldSubmit;
    };

    Step.prototype.toHash = function() {
      var branch, key, panesHash, tool, toolsHash, _ref, _ref2, _ref3, _ref4;
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
        responseTemplate: this.responseTemplate != null ? this.responseTemplate.getUrl() : void 0,
        submissibilityCriterion: (_ref = this.submissibilityCriterion) != null ? _ref : void 0,
        submissibilityDependsOn: (_ref2 = this.submissibilityDependsOn) != null ? _ref2 : void 0,
        responseBranches: (function() {
          var _i, _len, _ref3, _results;
          if (this.responseBranches.length > 0) {
            _ref3 = this.responseBranches;
            _results = [];
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              branch = _ref3[_i];
              _results.push(branch.toHash());
            }
            return _results;
          }
        }).call(this),
        isFinalStep: this.isFinalStep,
        nextButtonShouldSubmit: this.nextButtonShouldSubmit,
        variableAssignments: (_ref3 = this.variableAssignments) != null ? _ref3 : void 0,
        substitutedExpressions: (_ref4 = this.substitutedExpressions) != null ? _ref4 : void 0
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
    
/*
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
*/

(function() {
  var Datadef, dumbSingularize;

  dumbSingularize = require('../singularize').dumbSingularize;

  exports.Datadef = Datadef = (function() {

    Datadef.serializeDatadefs = function(datadefs) {
      var datadef, derivative, derivatives, ret, udp, udps, _i, _len;
      udps = [];
      derivatives = [];
      ret = [];
      for (_i = 0, _len = datadefs.length; _i < _len; _i++) {
        datadef = datadefs[_i];
        if (datadef.derivativeOf != null) {
          derivatives.push(datadef);
        } else {
          udps.push(datadef);
        }
      }
      if (udps.length > 0) {
        ret.push({
          type: 'UnorderedDataPoints',
          records: (function() {
            var _j, _len2, _results;
            _results = [];
            for (_j = 0, _len2 = udps.length; _j < _len2; _j++) {
              udp = udps[_j];
              _results.push(udp.toHash());
            }
            return _results;
          })()
        });
      }
      if (derivatives.length > 0) {
        ret.push({
          type: 'FirstDerivative',
          records: (function() {
            var _j, _len2, _results;
            _results = [];
            for (_j = 0, _len2 = derivatives.length; _j < _len2; _j++) {
              derivative = derivatives[_j];
              _results.push(derivative.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    function Datadef(_arg) {
      this.points = _arg.points, this.index = _arg.index, this.pointType = _arg.pointType, this.lineType = _arg.lineType, this.lineSnapDistance = _arg.lineSnapDistance, this.xUnits = _arg.xUnits, this.yUnits = _arg.yUnits, this.name = _arg.name, this.color = _arg.color, this.derivativeOf = _arg.derivativeOf, this.piecewiseLinear = _arg.piecewiseLinear;
      if (this.name == null) this.name = "datadef-" + this.index;
      if (this.lineSnapDistance == null) this.lineSnapDistance = 0;
    }

    Datadef.prototype.populateSourceDatasets = function() {
      if (this.derivativeOf != null) {
        return this.activity.populateDataSet([
          {
            name: this.derivativeOf
          }
        ]);
      }
    };

    Datadef.prototype.constructUnitRefs = function() {
      if (this.xUnits) {
        this.xUnitsRef = this.activity.getUnitRef(dumbSingularize(this.xUnits));
      }
      if (this.yUnits) {
        return this.yUnitsRef = this.activity.getUnitRef(dumbSingularize(this.yUnits));
      }
    };

    Datadef.prototype.setColor = function(color) {
      return this.color = color;
    };

    Datadef.prototype.getDerivativeSourceType = function(sourceDataName) {
      if (this.activity.hasDataref(sourceDataName)) {
        return 'dataref';
      } else if (this.activity.hasDatadef(sourceDataName)) {
        return 'datadef';
      } else {
        throw new Error("unknown source data: " + sourceDataName);
      }
    };

    Datadef.prototype.getDerivativeSourceName = function(sourceDataName) {
      var sourceType;
      sourceType = this.getDerivativeSourceType(sourceDataName);
      if (sourceType === 'datadef') return sourceDataName;
      return this.activity.getDatarefRef(sourceDataName).dataref.name;
    };

    Datadef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datadefs/" + this.name;
    };

    Datadef.prototype.toHash = function() {
      var hash, _ref, _ref2;
      hash = {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        xUnits: (_ref = this.xUnitsRef) != null ? _ref.unit.getUrl() : void 0,
        yUnits: (_ref2 = this.yUnitsRef) != null ? _ref2.unit.getUrl() : void 0,
        points: this.points,
        pointType: this.pointType,
        lineType: this.lineType,
        lineSnapDistance: this.lineSnapDistance,
        color: this.color
      };
      if (this.derivativeOf != null) {
        hash.sourceType = this.getDerivativeSourceType(this.derivativeOf);
        hash.source = this.getDerivativeSourceName(this.derivativeOf);
        hash.sourceIsPiecewiseLinear = this.piecewiseLinear || false;
      }
      return hash;
    };

    return Datadef;

  })();

}).call(this);

});

require.define("/runtime/dataref.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var DataRef;

  exports.DataRef = DataRef = (function() {

    DataRef.serializeDataRefs = function(datarefRefs) {
      var dataref, datarefRef, datarefsByType, datarefsOfOneType, key, ret, type;
      ret = [];
      datarefsByType = {};
      for (key in datarefRefs) {
        datarefRef = datarefRefs[key];
        dataref = datarefRef.dataref;
        type = dataref.expressionType;
        datarefsByType[type] || (datarefsByType[type] = []);
        datarefsByType[type].push(dataref);
      }
      for (type in datarefsByType) {
        datarefsOfOneType = datarefsByType[type];
        ret.push({
          type: type,
          records: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = datarefsOfOneType.length; _i < _len; _i++) {
              dataref = datarefsOfOneType[_i];
              _results.push(dataref.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    function DataRef(_arg) {
      this.datadefName = _arg.datadefName, this.expressionType = _arg.expressionType, this.expression = _arg.expression, this.expressionForm = _arg.expressionForm, this.angularFunction = _arg.angularFunction, this.xInterval = _arg.xInterval, this.params = _arg.params, this.index = _arg.index, this.name = _arg.name;
      if (!_arg.name) this.name = "dataref-" + this.index;
    }

    DataRef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datarefs/" + this.name;
    };

    DataRef.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        datadefName: this.datadefName,
        expressionForm: this.expressionForm,
        expression: this.expressionType === 'CompositeEquation' ? this.expression : void 0,
        angularFunction: this.angularFunction,
        xInterval: this.xInterval,
        params: this.params
      };
    };

    return DataRef;

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
        name: this.name,
        datadefName: this.datadefName,
        x: this.x,
        y: this.y
      };
    };

    return Tag;

  })();

}).call(this);

});

require.define("/author/expressionParser.js", function (require, module, exports, __dirname, __filename) {
    (function() {

  this.expressionParser = function() {};

  this.expressionParser.parseExpression = function(expression) {
    var expressionData, linearConstantRegExPattern, linearRegExPattern, params, regExpConstant, regExpNum, regExpNumberMultiplier, regExpSpace, sineRegExPattern, strResult;
    this.expression = expression;
    expressionData = {};
    params = {};
    regExpSpace = /\s+/g;
    this.expression = this.expression.replace(regExpSpace, "");
    regExpNum = "\\d+(?:\\.?\\d+)?";
    regExpNumberMultiplier = "(?:(?:[+-]?(?:" + regExpNum + ")))\\*?|(?:(?:[+-]))";
    regExpConstant = "[+-](?:" + regExpNum + ")";
    strResult = "";
    linearConstantRegExPattern = new RegExp('^y=([+-]?' + regExpNum + ')$', 'i');
    linearRegExPattern = new RegExp('^y=(?:(' + regExpNumberMultiplier + ')?x)(' + regExpConstant + ')?$', 'i');
    sineRegExPattern = new RegExp('^y=(' + regExpNumberMultiplier + ')?sin\\((' + regExpNumberMultiplier + ')?x(' + regExpConstant + ')?\\)(' + regExpConstant + ')?$', 'i');
    if (linearConstantRegExPattern.test(this.expression)) {
      expressionData['type'] = 'LinearEquation';
      expressionData['form'] = 'slope-intercept';
      params['slope'] = 0;
      params['yIntercept'] = parseFloat(RegExp.$1);
    } else if (linearRegExPattern.test(this.expression)) {
      expressionData['type'] = 'LinearEquation';
      expressionData['form'] = 'slope-intercept';
      if (parseFloat(RegExp.$1) || parseFloat(RegExp.$1) === 0) {
        params['slope'] = parseFloat(RegExp.$1);
      } else if (RegExp.$1 === "-") {
        params['slope'] = -1;
      } else if (RegExp.$1 === "" || RegExp.$1 === "+") {
        params['slope'] = 1;
      }
      if (RegExp.$2 === "") {
        params['yIntercept'] = 0;
      } else {
        params['yIntercept'] = parseFloat(RegExp.$2);
      }
    } else if (sineRegExPattern.test(this.expression)) {
      expressionData['type'] = 'SinusoidalEquation';
      expressionData['form'] = 'sine-cosine';
      expressionData['angularFunction'] = 'sine';
      if (parseFloat(RegExp.$1) || parseFloat(RegExp.$1) === 0) {
        params['amplitude'] = parseFloat(RegExp.$1);
      } else if (RegExp.$1 === "-") {
        params['amplitude'] = -1;
      } else if (RegExp.$1 === "" || RegExp.$1 === "+") {
        params['amplitude'] = 1;
      }
      if (parseFloat(RegExp.$2) || parseFloat(RegExp.$2) === 0) {
        params['frequency'] = parseFloat(RegExp.$2);
      } else if (RegExp.$2 === "-") {
        params['frequency'] = -1;
      } else if (RegExp.$2 === "" || RegExp.$2 === "+") {
        params['frequency'] = 1;
      }
      if (parseFloat(RegExp.$3) || parseFloat(RegExp.$3) === 0) {
        params['phase'] = parseFloat(RegExp.$3);
      } else if (RegExp.$3 === "-") {
        params['phase'] = 0;
      } else if (RegExp.$3 === "") {
        params['phase'] = 0;
      }
      if (parseFloat(RegExp.$4) || parseFloat(RegExp.$4) === 0) {
        params['centerAmplitude'] = parseFloat(RegExp.$4);
      } else if (RegExp.$4 === "-") {
        params['centerAmplitude'] = 0;
      } else if (RegExp.$4 === "") {
        params['centerAmplitude'] = 0;
      }
    } else if (this.expression === "") {
      expressionData['type'] = 'not supported';
    } else {
      expressionData['type'] = 'CompositeEquation';
    }
    expressionData['params'] = params;
    return expressionData;
  };

}).call(this);

});

require.define("/runtime/annotations.js", function (require, module, exports, __dirname, __filename) {
    
/*
  Annotation class and its subclasses
*/

(function() {
  var Annotation, AnnotationCollection, FreehandSketch, HighlightedPoint, Label, LabelSet, LineThroughPoints, PointAxisLineVisualPrompt, PointCircleVisualPrompt, RangeVisualPrompt, RiseArrow, RiseBracket, RunArrow, RunBracket, SimpleAnnotation,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  AnnotationCollection = exports.AnnotationCollection = {
    classFor: {}
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

  AnnotationCollection.classFor["HighlightedPoint"] = exports.HighlightedPoint = HighlightedPoint = (function(_super) {

    __extends(HighlightedPoint, _super);

    HighlightedPoint.prototype.RECORD_TYPE = 'HighlightedPoint';

    function HighlightedPoint(_arg) {
      this.datadefRef = _arg.datadefRef, this.tag = _arg.tag, this.color = _arg.color, this.index = _arg.index, this.name = _arg.name;
      if (this.name == null) this.name = "highlighted-point-" + this.index;
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

  })(Annotation);

  AnnotationCollection.classFor["RangeVisualPrompt"] = exports.RangeVisualPrompt = RangeVisualPrompt = (function(_super) {

    __extends(RangeVisualPrompt, _super);

    RangeVisualPrompt.prototype.RECORD_TYPE = 'SegmentOverlay';

    function RangeVisualPrompt(_arg) {
      this.datadefRef = _arg.datadefRef, this.color = _arg.color, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.index = _arg.index;
      this.name = "segment-overlay-" + this.index;
    }

    RangeVisualPrompt.prototype.toHash = function() {
      var hash, x1, x2;
      if (this.xMin === -Infinity) if (this.xMax !== Infinity) x1 = this.xMax;
      if (this.xMin !== -Infinity) {
        x1 = this.xMin;
        if (this.xMax !== Infinity) x2 = this.xMax;
      }
      hash = RangeVisualPrompt.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.color = this.color;
      hash.x1Record = x1;
      hash.x2Record = x2;
      if (this.xMin === -Infinity) hash.isUnboundedLeft = true;
      if (this.xMax === Infinity) hash.isUnboundedRight = true;
      return hash;
    };

    return RangeVisualPrompt;

  })(Annotation);

  AnnotationCollection.classFor["PointCircleVisualPrompt"] = exports.PointCircleVisualPrompt = PointCircleVisualPrompt = (function(_super) {

    __extends(PointCircleVisualPrompt, _super);

    PointCircleVisualPrompt.prototype.RECORD_TYPE = 'CircledPoint';

    function PointCircleVisualPrompt(_arg) {
      this.datadefRef = _arg.datadefRef, this.color = _arg.color, this.x = _arg.x, this.y = _arg.y, this.index = _arg.index;
      this.name = "circled-point-" + this.index;
    }

    PointCircleVisualPrompt.prototype.toHash = function() {
      var hash;
      hash = PointCircleVisualPrompt.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.color = this.color;
      hash.xRecord = this.x;
      hash.yRecord = this.y;
      return hash;
    };

    return PointCircleVisualPrompt;

  })(Annotation);

  AnnotationCollection.classFor["PointAxisLineVisualPrompt"] = exports.PointAxisLineVisualPrompt = PointAxisLineVisualPrompt = (function(_super) {

    __extends(PointAxisLineVisualPrompt, _super);

    PointAxisLineVisualPrompt.prototype.RECORD_TYPE = 'LineToAxis';

    function PointAxisLineVisualPrompt(_arg) {
      this.datadefRef = _arg.datadefRef, this.color = _arg.color, this.x = _arg.x, this.y = _arg.y, this.axis = _arg.axis, this.index = _arg.index;
      this.name = "line-to-axis-" + this.index;
    }

    PointAxisLineVisualPrompt.prototype.toHash = function() {
      var hash;
      hash = PointAxisLineVisualPrompt.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.color = this.color;
      hash.xRecord = this.x;
      hash.yRecord = this.y;
      hash.axis = this.axis;
      return hash;
    };

    return PointAxisLineVisualPrompt;

  })(Annotation);

  AnnotationCollection.classFor["FreehandSketch"] = exports.FreehandSketch = FreehandSketch = (function(_super) {

    __extends(FreehandSketch, _super);

    FreehandSketch.prototype.RECORD_TYPE = 'FreehandSketch';

    function FreehandSketch(_arg) {
      this.index = _arg.index;
      this.name = "freehand-sketch-" + this.index;
    }

    FreehandSketch.prototype.toHash = function() {
      var hash;
      hash = FreehandSketch.__super__.toHash.call(this);
      hash.color = '#CC0000';
      hash.points = [];
      return hash;
    };

    return FreehandSketch;

  })(Annotation);

  SimpleAnnotation = (function(_super) {

    __extends(SimpleAnnotation, _super);

    SimpleAnnotation.prototype.RECORD_TYPE = 'SimpleAnnotation';

    SimpleAnnotation.prototype.namePrefix = 'rise-and-run';

    function SimpleAnnotation(_arg) {
      this.index = _arg.index, this.datadefRef = _arg.datadefRef, this.p1Tag = _arg.p1Tag, this.p2Tag = _arg.p2Tag, this.color = _arg.color, this.name = _arg.name;
      if (this.name == null) this.name = "" + this.namePrefix + this.index;
    }

    SimpleAnnotation.prototype.toHash = function() {
      var hash;
      hash = SimpleAnnotation.__super__.toHash.call(this);
      hash.color = this.color;
      hash.datadefName = this.datadefRef.datadef.name;
      hash.p1Tag = this.p1Tag.getUrl();
      hash.p2Tag = this.p2Tag.getUrl();
      return hash;
    };

    return SimpleAnnotation;

  })(Annotation);

  AnnotationCollection.classFor["Label"] = exports.Label = Label = (function(_super) {

    __extends(Label, _super);

    Label.prototype.RECORD_TYPE = 'Label';

    function Label(_arg) {
      this.index = _arg.index, this.point = _arg.point, this.text = _arg.text, this.name = _arg.name, this.namePrefix = _arg.namePrefix, this.offset = _arg.offset;
      if (this.namePrefix == null) this.namePrefix = 'label';
      if (this.name == null) this.name = "" + this.namePrefix + "-" + this.index;
      if (this.offset == null) this.offset = [void 0, void 0];
      if (this.point == null) this.point = [void 0, void 0];
    }

    Label.prototype.toHash = function() {
      var hash;
      hash = Label.__super__.toHash.call(this);
      hash.text = this.text;
      hash.x = this.point[0];
      hash.y = this.point[1];
      hash.xOffset = this.offset[0];
      hash.yOffset = this.offset[1];
      return hash;
    };

    return Label;

  })(Annotation);

  AnnotationCollection.classFor["LabelSet"] = exports.LabelSet = LabelSet = (function(_super) {

    __extends(LabelSet, _super);

    LabelSet.prototype.RECORD_TYPE = 'LabelSet';

    LabelSet.prototype.namePrefix = 'labelSet';

    function LabelSet(_arg) {
      this.index = _arg.index, this.labels = _arg.labels, this.name = _arg.name;
      if (this.name == null) this.name = "" + this.namePrefix + "-" + this.index;
    }

    LabelSet.prototype.toHash = function() {
      var hash;
      hash = LabelSet.__super__.toHash.call(this);
      hash.labels = this.labels;
      return hash;
    };

    return LabelSet;

  })(Annotation);

  AnnotationCollection.classFor["RunArrow"] = exports.RunArrow = RunArrow = (function(_super) {

    __extends(RunArrow, _super);

    function RunArrow() {
      RunArrow.__super__.constructor.apply(this, arguments);
    }

    RunArrow.prototype.RECORD_TYPE = 'RunArrow';

    RunArrow.prototype.namePrefix = 'run-arrow';

    return RunArrow;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["RiseArrow"] = exports.RiseArrow = RiseArrow = (function(_super) {

    __extends(RiseArrow, _super);

    function RiseArrow() {
      RiseArrow.__super__.constructor.apply(this, arguments);
    }

    RiseArrow.prototype.RECORD_TYPE = 'RiseArrow';

    RiseArrow.prototype.namePrefix = 'rise-arrow';

    return RiseArrow;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["RunBracket"] = exports.RunBracket = RunBracket = (function(_super) {

    __extends(RunBracket, _super);

    function RunBracket() {
      RunBracket.__super__.constructor.apply(this, arguments);
    }

    RunBracket.prototype.RECORD_TYPE = 'RunBracket';

    RunBracket.prototype.namePrefix = 'run-bracket';

    return RunBracket;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["RiseBracket"] = exports.RiseBracket = RiseBracket = (function(_super) {

    __extends(RiseBracket, _super);

    function RiseBracket() {
      RiseBracket.__super__.constructor.apply(this, arguments);
    }

    RiseBracket.prototype.RECORD_TYPE = 'RiseBracket';

    RiseBracket.prototype.namePrefix = 'rise-bracket';

    return RiseBracket;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["LineThroughPoints"] = exports.LineThroughPoints = LineThroughPoints = (function(_super) {

    __extends(LineThroughPoints, _super);

    function LineThroughPoints() {
      LineThroughPoints.__super__.constructor.apply(this, arguments);
    }

    LineThroughPoints.prototype.RECORD_TYPE = 'LineThroughPoints';

    LineThroughPoints.prototype.namePrefix = 'line-throughpoints';

    return LineThroughPoints;

  })(SimpleAnnotation);

}).call(this);

});

require.define("/runtime/response-templates.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var ConstructedResponseTemplate, MultipleChoiceTemplate, NumericResponseTemplate, ResponseTemplate, ResponseTemplateCollection, join,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  join = function(name, vals) {
    return [name].concat(vals).map(escape).join('&');
  };

  ResponseTemplateCollection = exports.ResponseTemplateCollection = {
    classFor: {}
  };

  ResponseTemplate = (function() {

    function ResponseTemplate() {}

    ResponseTemplate.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/response-templates/" + this.name + "-" + this.number;
    };

    ResponseTemplate.prototype.toHash = function() {
      var _ref, _ref2;
      return {
        url: this.getUrl(),
        templateString: "",
        fieldChoicesList: [(_ref = this.choices) != null ? _ref : null],
        initialValues: (_ref2 = this.initialValues) != null ? _ref2 : [''],
        fieldTypes: this.fieldTypes
      };
    };

    return ResponseTemplate;

  })();

  ResponseTemplateCollection.classFor['NumericResponseTemplate'] = NumericResponseTemplate = (function(_super) {

    __extends(NumericResponseTemplate, _super);

    function NumericResponseTemplate(number, initialValues) {
      var val;
      this.number = number;
      this.initialValues = initialValues != null ? initialValues : [""];
      NumericResponseTemplate.__super__.constructor.call(this);
      this.name = 'numeric';
      this.fieldTypes = (function() {
        var _i, _len, _ref, _results;
        _ref = this.initialValues;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          val = _ref[_i];
          _results.push('numeric');
        }
        return _results;
      }).call(this);
    }

    NumericResponseTemplate.getUniqueKey = function(initialValues, choices) {
      return join('numeric', initialValues);
    };

    return NumericResponseTemplate;

  })(ResponseTemplate);

  ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] = ConstructedResponseTemplate = (function(_super) {

    __extends(ConstructedResponseTemplate, _super);

    function ConstructedResponseTemplate(number, initialValues) {
      var val;
      this.number = number;
      this.initialValues = initialValues != null ? initialValues : [""];
      ConstructedResponseTemplate.__super__.constructor.call(this);
      this.name = 'open';
      this.fieldTypes = (function() {
        var _i, _len, _ref, _results;
        _ref = this.initialValues;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          val = _ref[_i];
          _results.push('textarea');
        }
        return _results;
      }).call(this);
    }

    ConstructedResponseTemplate.getUniqueKey = function(initialValues, choices) {
      return join('open', initialValues);
    };

    return ConstructedResponseTemplate;

  })(ResponseTemplate);

  ResponseTemplateCollection.classFor['MultipleChoiceTemplate'] = MultipleChoiceTemplate = (function(_super) {

    __extends(MultipleChoiceTemplate, _super);

    function MultipleChoiceTemplate(number, initialValues, choices) {
      this.number = number;
      this.initialValues = initialValues;
      this.choices = choices;
      MultipleChoiceTemplate.__super__.constructor.call(this);
      this.name = "multiple-choice";
      this.fieldTypes = ["multiplechoice"];
    }

    MultipleChoiceTemplate.getUniqueKey = function(initialValues, choices) {
      return join('multiple-choice', choices);
    };

    return MultipleChoiceTemplate;

  })(ResponseTemplate);

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

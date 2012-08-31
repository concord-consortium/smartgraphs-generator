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
    }

    AuthorActivity.prototype.toRuntimeActivity = function() {
      var page, runtimeActivity, runtimeUnit, unit, _i, _j, _len, _len2, _ref, _ref2;
      runtimeActivity = new RuntimeActivity(this.owner, this.name, this.authorName);
      _ref = this.units;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        unit = _ref[_i];
        runtimeActivity.defineUnit((runtimeUnit = unit.toRuntimeUnit(runtimeActivity)).name, runtimeUnit);
      }
      _ref2 = this.pages;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        page = _ref2[_j];
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
  var AuthorPane, ConstructedResponseSequence, CorrectableSequenceWithFeedback, InstructionSequence, LineConstructionSequence, MultipleChoiceWithCustomHintsSequence, MultipleChoiceWithSequentialHintsSequence, NoSequence, NumericSequence, PickAPointSequence, Sequence, SlopeToolSequence, asObject,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  AuthorPane = require('./author-panes').AuthorPane;

  SlopeToolSequence = require('./slope_tool_sequence').SlopeToolSequence;

  LineConstructionSequence = require('./line_construction_sequence').LineConstructionSequence;

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
      var i, isActiveInputPane, n, numSteps, pane, previousAnnotation, step, steps, _len, _ref;
      steps = [];
      numSteps = this.predictionPanes.length || 1;
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
      var hint, indexed, _i, _len, _ref, _ref2;
      this.initialPrompt = _arg.initialPrompt, this.choices = _arg.choices, this.correctAnswerIndex = _arg.correctAnswerIndex, this.hints = _arg.hints, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page;
      _ref = [this.initialPrompt, this.confirmCorrect].map(asObject), this.initialPrompt = _ref[0], this.confirmCorrect = _ref[1];
      indexed = [];
      _ref2 = this.hints;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        hint = _ref2[_i];
        indexed[hint.choiceIndex] = hint;
      }
      this.orderedHints = (function() {
        var _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = indexed.length; _j < _len2; _j++) {
          hint = indexed[_j];
          if (hint != null) _results.push(hint);
        }
        return _results;
      })();
    }

    MultipleChoiceWithCustomHintsSequence.prototype.getCriterionForChoice = function(choiceIndex) {
      return ["=", ["responseField", 1], 1 + choiceIndex];
    };

    MultipleChoiceWithCustomHintsSequence.prototype.appendSteps = function(runtimePage) {
      var answerableSteps, confirmCorrectStep, hint, hintStepsByChoiceIndex, index, pane, responseTemplate, runtimeActivity, step, stepInfo, steps, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _results;
      runtimeActivity = runtimePage.activity;
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
      }
      _results = [];
      for (index = 0, _len3 = answerableSteps.length; index < _len3; index++) {
        step = answerableSteps[index];
        step.setSubmitButtonTitle("Check My Answer");
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        step.setResponseTemplate(responseTemplate);
        step.appendResponseBranch({
          criterion: this.getCriterionForChoice(this.correctAnswerIndex),
          step: confirmCorrectStep
        });
        _ref3 = this.orderedHints;
        for (_k = 0, _len4 = _ref3.length; _k < _len4; _k++) {
          hint = _ref3[_k];
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
      this.initialPrompt = _arg.initialPrompt, this.hints = _arg.hints, this.giveUp = _arg.giveUp, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page;
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
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
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
        step.addTaggingTool({
          tag: _this.tag,
          datadefRef: _this.datadefRef
        });
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

}).call(this);

});

require.define("/author/author-panes.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var AuthorPane, GraphPane, ImagePane, PredefinedGraphPane, PredictionGraphPane, SensorGraphPane, TablePane, dumbSingularize, expressionParser,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  dumbSingularize = require('../singularize').dumbSingularize;

  expressionParser = require('./expressionParser').expressionParser;

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
      this.title = _arg.title, this.xLabel = _arg.xLabel, this.xUnits = _arg.xUnits, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yUnits = _arg.yUnits, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks, includeAnnotationsFrom = _arg.includeAnnotationsFrom, this.showCrossHairs = _arg.showCrossHairs, this.showGraphGrid = _arg.showGraphGrid, this.showToolTipCoords = _arg.showToolTipCoords, this.xPrecision = _arg.xPrecision, this.yPrecision = _arg.yPrecision, this.expression = _arg.expression, this.lineType = _arg.lineType, this.pointType = _arg.pointType, this.lineSnapDistance = _arg.lineSnapDistance;
      this.annotationSources = includeAnnotationsFrom != null ? includeAnnotationsFrom.map(function(source) {
        var page, pane, _ref;
        _ref = (source.match(/^page\/(\d)+\/pane\/(\d)+$/)).slice(1, 3).map(function(s) {
          return parseInt(s, 10) - 1;
        }), page = _ref[0], pane = _ref[1];
        return {
          page: page,
          pane: pane
        };
      }) : void 0;
    }

    GraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
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
          yUnitsRef: this.yUnitsRef,
          lineType: this.lineType,
          pointType: this.pointType,
          lineSnapDistance: this.lineSnapDistance
        });
        return runtimeActivity.defineDatadef(dataKey, datadef);
      }
    };

    GraphPane.prototype.addToStep = function(step) {
      var _ref,
        _this = this;
      step.addGraphPane({
        title: this.title,
        datadefRef: this.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.index,
        showCrossHairs: this.showCrossHairs,
        showGraphGrid: this.showGraphGrid,
        showToolTipCoords: this.showToolTipCoords
      });
      return (_ref = this.annotationSources) != null ? _ref.forEach(function(source) {
        var page, pages, pane;
        pages = _this.page.activity.pages;
        page = pages[source.page];
        pane = page != null ? page.panes[source.pane] : void 0;
        if (!(page != null)) {
          throw new Error("When attempting to include annotations from pane " + (pane + 1) + " of page " + (page + 1) + ", couldn't find the page.");
        }
        if (!(pane != null)) {
          throw new Error("When attempting to include annotations from pane " + (pane + 1) + " of page " + (page + 1) + ", couldn't find the pane.");
        }
        if (!(pane.annotation != null)) {
          throw new Error("When attempting to include annotations from pane " + (pane + 1) + " of page " + (page + 1) + ", couldn't find the annotation.");
        }
        return step.addAnnotationToPane({
          index: source.pane,
          annotation: pane.annotation
        });
      }) : void 0;
    };

    return GraphPane;

  })();

  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function(_super) {

    __extends(PredefinedGraphPane, _super);

    function PredefinedGraphPane(_arg) {
      this.data = _arg.data;
      PredefinedGraphPane.__super__.constructor.apply(this, arguments);
    }

    PredefinedGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      var expressionData;
      PredefinedGraphPane.__super__.addToPageAndActivity.apply(this, arguments);
      if (this.expression !== null && this.expression !== void 0) {
        expressionData = expressionParser.parseExpression(this.expression);
        if ((expressionData.type != null) && expressionData.type !== "not supported") {
          return this.dataRef = runtimeActivity.createDataRef({
            expressionType: expressionData.type,
            xInterval: this.xPrecision,
            expressionForm: expressionData.form,
            params: expressionData.params,
            datadefname: this.datadefRef.datadef.name
          });
        }
      }
    };

    PredefinedGraphPane.prototype.addToStep = function(step) {
      PredefinedGraphPane.__super__.addToStep.apply(this, arguments);
      if (this.dataRef != null) {
        return step.addDataRefToPane({
          index: this.index,
          dataRef: this.dataRef
        });
      }
    };

    return PredefinedGraphPane;

  })(GraphPane);

  AuthorPane.classFor['SensorGraphPane'] = SensorGraphPane = (function(_super) {

    __extends(SensorGraphPane, _super);

    function SensorGraphPane() {
      SensorGraphPane.__super__.constructor.apply(this, arguments);
      this.data = [];
    }

    SensorGraphPane.prototype.addToStep = function(step) {
      SensorGraphPane.__super__.addToStep.apply(this, arguments);
      return step.addSensorTool({
        index: this.index,
        datadefRef: this.datadefRef
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

    PredictionGraphPane.prototype.addToStep = function(step, _arg) {
      var isActiveInputPane, previousAnnotation, uiBehavior;
      isActiveInputPane = _arg.isActiveInputPane, previousAnnotation = _arg.previousAnnotation;
      PredictionGraphPane.__super__.addToStep.apply(this, arguments);
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
      if (previousAnnotation) {
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

require.define("/author/expressionParser.js", function (require, module, exports, __dirname, __filename) {
    (function() {

  this.expressionParser = function() {};

  this.expressionParser.parseExpression = function(expression) {
    var expressionData, linearConstantRegExPattern, linearRegExPattern, params, regExpConstant, regExpNum, regExpNumberMultiplier, regExpSpace, strResult;
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
      } else if (RegExp.$1 === "") {
        params['slope'] = 1;
      }
      if (RegExp.$2 === "") {
        params['yIntercept'] = 0;
      } else {
        params['yIntercept'] = parseFloat(RegExp.$2);
      }
    } else {
      expressionData['type'] = 'not supported';
    }
    expressionData['params'] = params;
    return expressionData;
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
        return "" + (first_point ? "an" : "a second") + " \n<strong><em>endpoint</em></strong> of the range \n" + this.xMin + " through " + (this.ending_text()) + ".";
      } else {
        return "" + (first_point ? "a" : "a second") + " \npoint between " + this.xMin + " and " + (this.ending_text()) + ".";
      }
    };

    SlopeToolSequence.prototype.select_first_point_text = function() {
      return "<p> Select " + (this.range_text()) + " </p>\n" + (this.click_ok_text());
    };

    SlopeToolSequence.prototype.first_point_wrong_text = function() {
      return "" + (this.incorrect_text()) + "\n<p>The point you have selected is not \n" + (this.range_text()) + "\nTry again.</p>\n" + (this.select_first_point_text());
    };

    SlopeToolSequence.prototype.select_second_point_text = function(first_time) {
      if (first_time == null) first_time = true;
      return "<p>Now select\n" + (this.range_text(false)) + "</p>\n" + (this.click_ok_text());
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
      this.firstQuestionIsSlopeQuestion = _arg.firstQuestionIsSlopeQuestion, this.studentSelectsPoints = _arg.studentSelectsPoints, this.selectedPointsMustBeAdjacent = _arg.selectedPointsMustBeAdjacent, this.studentMustSelectEndpointsOfRange = _arg.studentMustSelectEndpointsOfRange, this.slopeVariableName = _arg.slopeVariableName, this.firstQuestion = _arg.firstQuestion, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.tolerance = _arg.tolerance, this.page = _arg.page;
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
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
    };

    SlopeToolSequence.prototype.setupStep = function(_arg) {
      var annotation, responseTemplate, response_def, runtimePage, step, stepdef, tool, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _m, _n, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef;
      step = this.runtimeStepsByName[stepdef.name];
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: this.getDataDefRef(runtimePage.activity),
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index
      });
      step.addTablePane({
        datadefRef: this.getDataDefRef(runtimePage.activity),
        index: this.tablePane.index
      });
      step.beforeText = stepdef.beforeText;
      step.substitutedExpressions = stepdef.substitutedExpressions;
      step.variableAssignments = stepdef.variableAssignments;
      step.submitButtonTitle = stepdef.submitButtonTitle;
      if (stepdef.responseTemplate) {
        responseTemplate = runtimePage.activity.createAndAppendResponseTemplate("NumericResponseTemplate");
        step.setSubmissibilityCriterion(stepdef.submissibilityCriterion);
        step.setResponseTemplate(responseTemplate);
      }
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
      _ref2 = stepdef.highLightedGraphAnnotations || [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        annotation = _ref2[_j];
        if (this.annotations[annotation]) {
          step.addHighlightedAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref3 = stepdef.tableAnnotations || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        annotation = _ref3[_k];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.tablePane.index
          });
        }
      }
      _ref4 = stepdef.highLightedTableAnnotations || [];
      for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
        annotation = _ref4[_l];
        if (this.annotations[annotation]) {
          step.addHighlightedAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.tablePane.index
          });
        }
      }
      _ref5 = stepdef.tools || [];
      for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
        tool = _ref5[_m];
        step.addTaggingTool({
          tag: this.tags[tool.tag],
          datadefRef: this.getDataDefRef(runtimePage.activity)
        });
      }
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      _ref6 = stepdef.responseBranches || [];
      _results = [];
      for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
        response_def = _ref6[_n];
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

    LineConstructionSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
    };

    LineConstructionSequence.prototype.setupStep = function(_arg) {
      var annotation, response_def, runtimePage, step, stepdef, tool, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef;
      step = this.runtimeStepsByName[stepdef.name];
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: this.getDataDefRef(runtimePage.activity),
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index,
        showCrossHairs: stepdef.showCrossHairs,
        showGraphGrid: stepdef.showGraphGrid,
        showToolTipCoords: stepdef.showToolTipCoords
      });
      step.addTablePane({
        datadefRef: this.getDataDefRef(runtimePage.activity),
        index: this.tablePane.index
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
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
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

    LineConstructionSequence.prototype.check_correct_answer = function() {
      return [
        {
          "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
          "step": "confirm_correct"
        }, {
          "criterion": ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance],
          "step": "incorrect_answer_but_slope_correct"
        }, {
          "criterion": ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance],
          "step": "incorrect_answer_but_y_intercept_correct"
        }
      ];
    };

    function LineConstructionSequence(_arg) {
      var i, pane, _len, _ref;
      this.slope = _arg.slope, this.slopeTolerance = _arg.slopeTolerance, this.yIntercept = _arg.yIntercept, this.yInterceptTolerance = _arg.yInterceptTolerance, this.initialPrompt = _arg.initialPrompt, this.confirmCorrect = _arg.confirmCorrect, this.slopeIncorrect = _arg.slopeIncorrect, this.yInterceptIncorrect = _arg.yInterceptIncorrect, this.allIncorrect = _arg.allIncorrect, this.page = _arg.page;
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

    LineConstructionSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, otherAnnotations, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
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
      _ref2 = this.steps;
      _results = [];
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        }));
      }
      return _results;
    };

    LineConstructionSequence.prototype.first_question = function() {
      return {
        name: "question",
        defaultBranch: "incorrect_answer_all",
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
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_all = function() {
      return {
        name: "incorrect_answer_all",
        defaultBranch: "incorrect_answer_all",
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
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_y_intercept_correct = function() {
      return {
        name: "incorrect_answer_but_y_intercept_correct",
        defaultBranch: "incorrect_answer_all",
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
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_slope_correct = function() {
      return {
        name: "incorrect_answer_but_slope_correct",
        defaultBranch: "incorrect_answer_all",
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
        responseBranches: this.check_correct_answer()
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
      this.steps.push(this.first_question());
      this.steps.push(this.incorrect_answer_all());
      this.steps.push(this.incorrect_answer_but_y_intercept_correct());
      this.steps.push(this.incorrect_answer_but_slope_correct());
      return this.steps.push(this.confirm_correct());
    };

    return LineConstructionSequence;

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
  var Annotation, AnnotationCollection, Axis, DataRef, Datadef, HighlightedPoint, ResponseTemplateCollection, RuntimeActivity, RuntimePage, RuntimeUnit, SegmentOverlay, Step, Tag, slugify, _ref,
    __hasProp = Object.prototype.hasOwnProperty;

  slugify = require('../slugify').slugify;

  RuntimePage = require('./runtime-page').RuntimePage;

  Step = require('./step').Step;

  Axis = require('./axis').Axis;

  RuntimeUnit = require('./runtime-unit').RuntimeUnit;

  Datadef = require('./datadef').Datadef;

  DataRef = require('./dataref').DataRef;

  Tag = require('./tag').Tag;

  _ref = require('./annotations'), AnnotationCollection = _ref.AnnotationCollection, Annotation = _ref.Annotation, HighlightedPoint = _ref.HighlightedPoint, SegmentOverlay = _ref.SegmentOverlay;

  ResponseTemplateCollection = require('./response-templates').ResponseTemplateCollection;

  exports.RuntimeActivity = RuntimeActivity = (function() {

    function RuntimeActivity(owner, name, authorName) {
      this.owner = owner;
      this.name = name;
      this.authorName = authorName;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefRefs = {};
      this.nDatadefs = 0;
      this.dataRefRefs = {};
      this.nDataRefs = 0;
      this.annotations = {};
      this.annotationCounts = {};
      this.tags = [];
      this.nTags = 0;
      this.responseTemplates = {};
      this.responseTemplatesCounts = {};
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
      var datadef, lineSnapDistance, lineType, pointType, points, xLabel, xUnitsRef, yLabel, yUnitsRef;
      points = _arg.points, xLabel = _arg.xLabel, xUnitsRef = _arg.xUnitsRef, yLabel = _arg.yLabel, yUnitsRef = _arg.yUnitsRef, pointType = _arg.pointType, lineType = _arg.lineType, lineSnapDistance = _arg.lineSnapDistance;
      datadef = new Datadef({
        points: points,
        xLabel: xLabel,
        xUnitsRef: xUnitsRef,
        yLabel: yLabel,
        yUnitsRef: yUnitsRef,
        index: ++this.nDatadefs,
        pointType: pointType,
        lineType: lineType,
        lineSnapDistance: lineSnapDistance
      });
      datadef.activity = this;
      return datadef;
    };

    RuntimeActivity.prototype.createDataRef = function(_arg) {
      var dataRef, datadefname, expressionForm, expressionType, index, params, xInterval, _base;
      datadefname = _arg.datadefname, expressionType = _arg.expressionType, expressionForm = _arg.expressionForm, xInterval = _arg.xInterval, params = _arg.params, index = _arg.index;
      dataRef = new DataRef({
        datadefname: datadefname,
        expressionType: expressionType,
        expressionForm: expressionForm,
        xInterval: xInterval,
        params: params,
        index: ++this.nDataRefs
      });
      dataRef.activity = this;
      if ((_base = this.dataRefRefs)[expressionType] == null) {
        _base[expressionType] = [];
      }
      this.dataRefRefs[expressionType].push(dataRef);
      return dataRef;
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

    RuntimeActivity.prototype.defineDatadef = function(key, datadef) {
      var ref;
      ref = this.getDatadefRef(key);
      if (ref.datadef != null) throw new Error("Redefinition of datadef " + key);
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

    RuntimeActivity.prototype.createAndAppendAnnotation = function(hash) {
      var AnnotationClass, annotation, type, _base, _base2;
      type = hash.type;
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
        datarefs: this.nDataRefs !== 0 ? DataRef.serializeDataRefs(this.dataRefRefs) : void 0,
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
      var datadefRef, index, showCrossHairs, showGraphGrid, showToolTipCoords, title, xAxis, yAxis;
      title = _arg.title, datadefRef = _arg.datadefRef, xAxis = _arg.xAxis, yAxis = _arg.yAxis, index = _arg.index, showCrossHairs = _arg.showCrossHairs, showGraphGrid = _arg.showGraphGrid, showToolTipCoords = _arg.showToolTipCoords;
      return this.panes[index] = {
        title: title,
        datadefRef: datadefRef,
        dataRef: [],
        xAxis: xAxis,
        yAxis: yAxis,
        showCrossHairs: showCrossHairs,
        showGraphGrid: showGraphGrid,
        showToolTipCoords: showToolTipCoords,
        annotations: [],
        highlightedAnnotations: [],
        toHash: function() {
          var annotation, dataref, _ref, _ref2, _ref3;
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
            data: this.datadefRef != null ? [this.datadefRef.datadef.name] : [],
            datarefs: (function() {
              var _i, _len, _ref4, _results;
              if (this.dataRef.length === 0) {
                return;
              } else {
                _ref4 = this.dataRef;
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  dataref = _ref4[_i];
                  _results.push(dataref.name);
                }
                return _results;
              }
            }).call(this)
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
        highlightedAnnotations: [],
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

    Step.prototype.addAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].annotations.push(annotation);
    };

    Step.prototype.addDataRefToPane = function(_arg) {
      var dataRef, index;
      dataRef = _arg.dataRef, index = _arg.index;
      return this.panes[index].dataRef.push(dataRef);
    };

    Step.prototype.addHighlightedAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].highlightedAnnotations.push(annotation);
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
      this.points = _arg.points, this.xLabel = _arg.xLabel, this.xUnitsRef = _arg.xUnitsRef, this.yLabel = _arg.yLabel, this.yUnitsRef = _arg.yUnitsRef, this.index = _arg.index, this.pointType = _arg.pointType, this.lineType = _arg.lineType, this.lineSnapDistance = _arg.lineSnapDistance;
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
        points: this.points,
        pointType: this.pointType,
        lineType: this.lineType,
        lineSnapDistance: this.lineSnapDistance
      };
    };

    return Datadef;

  })();

}).call(this);

});

require.define("/runtime/dataref.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var DataRef;

  exports.DataRef = DataRef = (function() {

    DataRef.serializeDataRefs = function(dataRefRefs) {
      var dataRef, dataRefOfOneType, key, ret;
      ret = [];
      for (key in dataRefRefs) {
        dataRefOfOneType = dataRefRefs[key];
        ret.push({
          type: dataRefOfOneType[0].expressionType,
          records: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = dataRefOfOneType.length; _i < _len; _i++) {
              dataRef = dataRefOfOneType[_i];
              _results.push(dataRef.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    function DataRef(_arg) {
      this.datadefname = _arg.datadefname, this.expressionType = _arg.expressionType, this.expressionForm = _arg.expressionForm, this.xInterval = _arg.xInterval, this.params = _arg.params, this.index = _arg.index;
      this.name = "dataref-" + this.index;
    }

    DataRef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datarefs/" + this.name;
    };

    DataRef.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        datadefname: this.datadefname,
        expressionForm: this.expressionForm,
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

require.define("/runtime/annotations.js", function (require, module, exports, __dirname, __filename) {
    
/*
  Annotation class and its subclasses
*/

(function() {
  var Annotation, AnnotationCollection, FreehandSketch, HighlightedPoint, LineThroughPoints, PointAxisLineVisualPrompt, PointCircleVisualPrompt, RangeVisualPrompt, RiseArrow, RiseBracket, RunArrow, RunBracket, SimpleAnnotation, annotations,
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

  annotations = [];

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

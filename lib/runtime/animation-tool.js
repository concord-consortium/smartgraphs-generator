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

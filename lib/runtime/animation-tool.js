(function() {
  var AnimationTool;

  exports.AnimationTool = AnimationTool = (function() {

    AnimationTool.prototype.index = null;

    AnimationTool.prototype.panes = null;

    AnimationTool.prototype.hideGraph = false;

    function AnimationTool(_arg) {
      this.datasetName = _arg.datasetName, this.staticImageYValues = _arg.staticImageYValues;
    }

    AnimationTool.prototype.toHash = function() {
      var y;
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
          ]
        }
      };
    };

    return AnimationTool;

  })();

}).call(this);

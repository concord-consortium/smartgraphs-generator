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

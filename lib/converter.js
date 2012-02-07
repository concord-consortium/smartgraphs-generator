(function() {
  var AuthorActivity;

  AuthorActivity = require('./author/author-activity').AuthorActivity;

  exports.convert = function(input) {
    return new AuthorActivity(input).toRuntimeActivity().toHash();
  };

}).call(this);

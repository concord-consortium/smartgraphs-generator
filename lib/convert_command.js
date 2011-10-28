(function() {
  /*
    Module dependencies
  */
  var convert, program;
  program = require("commander");
  convert = require('./convert');
  exports.run = function() {
    /*
        Options
      */
    /*
        Program body
      */
    var outputObject;
    outputObject = convert.convert_funct({});
    return console.log(JSON.stringify(outputObject));
  };
}).call(this);

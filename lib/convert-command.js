
/*
  Module dependencies
*/

(function() {
  var converter, program;

  program = require("commander");

  converter = require('./converter');

  exports.run = function() {
    /*
        Options
    */
    /*
        Program body
    */
    var buffer, stdin;
    stdin = process.openStdin();
    stdin.setEncoding('utf8');
    buffer = "";
    stdin.on('data', function(data) {
      return buffer += data;
    });
    return stdin.on('end', function() {
      var inputObject, outputObject;
      inputObject = JSON.parse(buffer);
      outputObject = converter.convert(inputObject);
      return console.log(JSON.stringify(outputObject, null, 2));
    });
  };

}).call(this);

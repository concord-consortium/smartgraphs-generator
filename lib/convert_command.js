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
      outputObject = convert.convert_funct(inputObject);
      return console.log(JSON.stringify(outputObject));
    });
  };
}).call(this);

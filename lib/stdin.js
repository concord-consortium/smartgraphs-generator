(function() {
  var stdin;
  stdin = process.openStdin();
  stdin.on('data', function(data) {
    return console.log(data.toString());
  });
}).call(this);

fs      = require 'fs'
{spawn} = require 'child_process'

task 'build', "build the smartgraphs-generator javascript into lib/ from coffeescript in src/", build = (cb) ->
  runCoffee ['-c', '-o', 'lib/'].concat(srcFiles()), cb

task 'watch', "watch the coffeescript source tree in src/ for changes and build javascript files into lib/", watch = (cb) ->
  runCoffee ['-o', 'lib/', '-cw', 'src/'], cb

srcFiles = ->
  files = fs.readdirSync 'src'
  return ('src/' + file for file in files when file.match(/\.coffee$/))

echo = (buffer) -> console.log buffer.toString()

runCoffee = (args, cb) ->
  proc =         spawn 'nbin/coffee', args
  proc.stderr.on 'data', echo
  proc.stdout.on 'data', echo
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'

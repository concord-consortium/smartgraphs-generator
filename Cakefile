fs      = require 'fs'
{spawn} = require 'child_process'

task 'build', "build the smartgraphs-generator javascript into lib/ from coffeescript in src/", build = (cb) ->
  run 'nbin/coffee', ['-c', '-o', 'lib/'].concat(srcFiles()), cb

task 'watch', "watch the coffeescript source tree in src/ for changes and build javascript files into lib/", watch = (cb) ->
  run 'nbin/jitter', ['src', 'lib'], cb

srcFiles = ->
  files = fs.readdirSync 'src'
  return ('src/' + file for file in files when file.match(/\.coffee$/))

echo = (buffer) -> console.log buffer.toString()

run = (cmd, args, cb) ->
  proc =         spawn cmd, args
  proc.stderr.on 'data', echo
  proc.stdout.on 'data', echo
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'

fs      = require 'fs'
{spawn} = require 'child_process'

option '-q', '--quiet', "When running tests, do not use --verbose flag"

task 'build:js', "build the smartgraphs-generator javascript in lib/ from coffeescript in src/", buildjs = (cb) ->
  run 'nbin/coffee', ['-c', '-o', 'lib/'].concat(srcFiles()), cb

task 'build:browser', "build the browserified javascript from javascript in lib/", buildBrowser = (cb) ->
  run 'nbin/browserify', ['lib/converter.js', '-o', 'browser/js/converter.js'], cb

task 'build', "build javascript and browserified test page", build = (cb) ->
  buildjs ->
    buildBrowser(cb)

task 'testpage', "build and open test page", testpage = (cb) ->
  build ->
    run 'open', ['browser/testpage.html'], cb

task 'watch', "watch the coffeescript source tree in src/ for changes and build javascript files into lib/", watch = (cb) ->
  run 'nbin/jitter', ['src', 'lib'], cb

task 'test', "run all Jasmine spec tests in spec/", test = ({quiet}) ->
  options = ['--coffee', 'spec']
  options.unshift '--verbose' unless quiet?
  run 'nbin/jasmine-node', options

srcFiles = ->
  files = fs.readdirSync 'src'
  ('src/' + file for file in files when file.match(/\.coffee$/))

echo = (buffer) -> process.stdout.write buffer

run = (cmd, args, cb) ->
  proc =         spawn cmd, args
  proc.stderr.on 'data', echo
  proc.stdout.on 'data', echo
  proc.on        'exit', (status) ->
    process.exit(1) if status != 0
    cb() if typeof cb is 'function'

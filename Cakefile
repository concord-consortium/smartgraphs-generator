fs      = require 'fs'
{spawn} = require 'child_process'

option '-q', '--quiet', "When running tests, do not use --verbose flag"
option '-j', '--junit', "When running tests, generate a junit XML report"

task 'coffeelint', "check src/ style which helps to keep CoffeeScript code clean and consistent", coffeelint = (cb) ->
  run 'nbin/coffeelint', ['-f', 'coffeelint-config.json', '-r', 'src/'], cb

task 'coffeelint_spec', "check spec/ style which helps to keep CoffeeScript code clean and consistent", coffeelint_spec = (cb) ->
  run 'nbin/coffeelint', ['-f', 'coffeelint-config.json', '-r', 'spec/'], cb

task 'build:js', "build the smartgraphs-generator javascript in lib/ from coffeescript in src/", buildjs = (cb) ->
  run 'nbin/coffee', ['-o', 'lib/', '-c', 'src/'], cb

task 'build:browser', "build the browserified javascript from javascript in lib/", buildBrowser = (cb) ->
  run 'nbin/browserify', ['lib/converter.js', '-o', 'browser/js/converter.js'], cb

task 'build', "build javascript and browserified test page", build = (cb) ->
  coffeelint ->
    buildjs ->
      buildBrowser(cb)

task 'testpage', "build and open test page", testpage = (cb) ->
  build ->
    run 'open', ['browser/testpage.html'], cb

task 'watch', "watch the coffeescript source tree in src/ for changes and build javascript files into lib/", watch = (cb) ->
  run 'nbin/coffee', ['-o', 'lib/', '-w', 'src/'], cb

task 'test', "run all Jasmine spec tests in spec/", test = ({quiet, junit}) ->
  options = ['--coffee', 'spec']
  options.unshift '--verbose' unless quiet?
  options.unshift '--junitreport' if junit?
  coffeelint_spec ->  
    run 'nbin/jasmine-node', options

task 'build_st_tests', "automatical build tests", build_st_tests = (cb) ->
  make_slope_tool_tests()

activity_urls = ->
  [
    {
      number: '16'
      name: 'slope-tool-a'
    },{
      number: '17'
      name: 'slope-tool-b'
    },{
      number: '18'
      name: 'slope-tool-c'
    },{
      number: '19'
      name: 'slope-kahn-no-units'
    },{
      number: '22'
      name: 'slope-average-over-range'
    }
  ]

make_slope_tool_tests = ->
  prefix = "http://smartgraphs-authoring.staging.concord.org/activities/"
  for url in activity_urls()
    in_json_url   = "#{prefix}#{url.number}.json"
    in_json_file  = "example-data/input/#{url.name}.json"
    out_json_url  = "#{prefix}#{url.number}/student_preview.json"
    out_json_file = "example-data/expected-ouput/#{url.name}.json"

    curl_file( in_json_url, in_json_file)
    curl_file(out_json_url,out_json_file)

curl_file = (srcUrl,dstFile) ->
  echo "#{srcUrl} ==> #{dstFile}\n"
  run "curl", [srcUrl, '-o', dstFile]

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

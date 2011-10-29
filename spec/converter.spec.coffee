converter = require '../lib/converter'
fs        = require 'fs'
path      = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');

describe "the converter", ->
  inputString  = null
  inputObject  = null
  outputString = null

  beforeEach ->
    inputString  = fs.readFileSync exampleDataDir + "/input/marias-run.json", 'utf8'
    inputObject  = JSON.parse inputString
    outputString = fs.readFileSync exampleDataDir + "/expected-ouput/marias-run.json", 'utf8'

  it "should exist", ->
    expect(converter).toBeDefined()
    expect(converter.convert).toBeDefined()
    expect(typeof converter.convert).toBe 'function'

  it "should take an object", ->
    converter.convert inputObject

  it "should output an object", ->
    outputObject = converter.convert inputObject
    expect(typeof outputObject).toBe 'object'

  it "should output the correct object", ->
    outputObject = converter.convert inputObject
    expectedOutput = JSON.stringify(JSON.parse outputString)
    expect(JSON.stringify outputObject).toEqual expectedOutput

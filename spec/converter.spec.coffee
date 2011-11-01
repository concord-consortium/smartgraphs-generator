converter = require '../lib/converter'
fs        = require 'fs'
path      = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');

describe "the converter", ->
  inputString  = null
  inputObject  = null

  beforeEach ->
    inputString  = fs.readFileSync exampleDataDir + "/input/two-basic-pages.json", 'utf8'
    inputObject  = JSON.parse inputString

  it "should exist", ->
    expect(converter).toBeDefined()
    expect(converter.convert).toBeDefined()
    expect(typeof converter.convert).toBe 'function'

  it "should take an object", ->
    converter.convert inputObject

  it "should output an object", ->
    outputObject = converter.convert inputObject
    expect(typeof outputObject).toBe 'object'

  for exampleFile in fs.readdirSync(exampleDataDir + "/input")
    describe "converting #{exampleFile}", ->
    
      it "should output the correct object", ->
        exInputString  = fs.readFileSync exampleDataDir + "/input/" + exampleFile, 'utf8'
        exInputObject  = JSON.parse inputString
        expectedOutputString = fs.readFileSync exampleDataDir + "/expected-ouput/" + exampleFile, 'utf8'
        outputObject = converter.convert inputObject
        expect(outputObject).toEqual JSON.parse(expectedOutputString)

Convert = require "../lib/convert"
fs = require 'fs'
path = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');

describe "the converter", ->
  inputString = null
  inputObject = null
  outputString = null

  beforeEach ->
    inputString = fs.readFileSync exampleDataDir + "/input/marias-run.json", 'utf8'
    inputObject = JSON.parse inputString
    outputString = fs.readFileSync exampleDataDir + "/expected-ouput/marias-run.json", 'utf8'

  it "should exist", ->
    expect(Convert).toBeDefined
    expect(Convert.convert_funct).toBeDefined
    expect(typeof Convert.convert_funct).toBe('function')

  it "should take an object", ->
    Convert.convert_funct inputObject

  it "should output an object", ->
    outputObject = Convert.convert_funct inputObject
    expect(typeof outputObject).toBe('object')

  it "should output the correct object", ->
    outputObject = Convert.convert_funct inputObject
    expectedOutput = JSON.stringify(JSON.parse(outputString))
    expect(JSON.stringify outputObject).toEqual expectedOutput
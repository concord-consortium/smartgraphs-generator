Convert = require "../lib/convert"
fs = require 'fs'
path = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');

describe "the converter", ->
  it "should exist", ->
    expect(Convert).toBeDefined
    expect(Convert.convert_funct).toBeDefined
    
  it "should take an object", ->
    inputString = fs.readFileSync exampleDataDir + "/input/marias-run.json", 'utf8'
    expect(inputString).not.toBeNull
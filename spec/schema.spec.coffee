{JSV} = require 'JSV'
fs        = require 'fs'
path      = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data')

schemaString = fs.readFileSync exampleDataDir + "/runtimeSchema.json", 'utf8'
schema = JSON.parse schemaString
env = JSV.createEnvironment()

describe "the runtime schema", ->

  for exampleFile in fs.readdirSync(exampleDataDir + "/expected-ouput")
    do (exampleFile) ->
      describe "validating #{exampleFile}", ->

        it "should assert that the activity is valid", ->
          activityString  = fs.readFileSync exampleDataDir + "/expected-ouput/" + exampleFile, 'utf8'
          activity  = JSON.parse activityString
          report = env.validate(activity, schema)
          expect(report.errors.length).toBe(0)

          ## uncomment to help debug schema
          # if report.errors.length > 0
          #   console.log "=========== #{exampleFile} ==========="
          #   console.log report.errors

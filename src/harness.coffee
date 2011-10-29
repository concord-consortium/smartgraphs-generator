# To play with this:
#
# $ nbin/coffee
# coffee> {activity} = require './lib/harness'
# coffee>

fs         = require 'fs'
path       = require 'path'
dir        = path.join path.dirname(fs.realpathSync(__filename)), '../example-data'

input      = fs.readFileSync dir + '/input/marias-run.json', 'utf8'
hash       = JSON.parse input

{InputActivity}  = require './input/input-activity'
exports.activity = new InputActivity hash

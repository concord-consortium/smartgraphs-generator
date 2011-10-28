###
  Module dependencies
###

program = require "commander"
convert = require './convert'

exports.run = ->
  ###
    Options
  ###
  
  # none so far
  
  ###
    Program body
  ###
  
  outputObject = convert.convert_funct({})
  console.log JSON.stringify outputObject
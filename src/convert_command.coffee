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
  stdin = process.openStdin()
  stdin.setEncoding 'utf8'
  buffer = ""
  stdin.on 'data', (data) -> 
    buffer += data

  stdin.on 'end', ->
    inputObject = JSON.parse(buffer)
    outputObject = convert.convert_funct(inputObject)
    console.log JSON.stringify outputObject
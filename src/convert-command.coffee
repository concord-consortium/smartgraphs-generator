###
  Module dependencies
###

program   = require "commander"
converter = require './converter'

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
    inputObject  = JSON.parse buffer
    outputObject = converter.convert inputObject
    console.log JSON.stringify outputObject, null, 2

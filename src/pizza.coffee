###
  Module dependencies
###

program = require "commander"

exports.run = ->

  ###
    Options
  ###

  program
    .version("0.0.1")
    .option("-p, --peppers", "Add peppers")
    .option("-P, --pineapple", "Add pineapple")
    .option("-b, --bbq", "Add bbq sauce")
    .option("-c, --cheese [type]", "Add the specified type of cheese [marble]", "marble")
    .parse(process.argv)

  ###
    Program body
  ###

  console.log "you ordered a pizza with:"
  if program.peppers   then console.log "  - peppers"
  if program.pineapple then console.log "  - pineapple"
  if program.bbq       then console.log "  - bbq"
  console.log "  - #{program.cheese} cheese"

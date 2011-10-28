###
  Input "Activity" object.

  This class is built from an input hash (in the 'semantic JSON' format) and instantiates and manages child objects
  which represent the different model objects of the semantic JSON format.

  The various subtypes of pages will know how to call 'builder' methods on the output.* classes to insert elements as
  needed.

  For example, an input.sensorPage would have to know to call methods like output.Activity.addGraph and
  output.Activity.addDataset, as well as mehods such as, perhaps, output.Activity.appendPage, output.Page.appendStep,
  and output.Step.addTool('sensor')

  The complexity of processing the input tree and deciding which builder methods on the output Page, output Step, etc
  to call mostly belong here. We expect there will be a largish and growing number of classes and subclasses in the
  input.* group, and that the output.* classes mostly just need to help keep the 'accounting' straight when the input.* classes call builder
  methods on them.
###

exports.Activity = class Activity

  constructor: (@hash) ->
    # '@' syntax means 'this'
    # using '@' in the arguments list means "call the first argument 'hash' and assign its value to this.hash"
    return

  process: ->
    this.pages.process()

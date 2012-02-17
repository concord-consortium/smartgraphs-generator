"type": "Activity"
"name": "Graph and Table"
"pages": [
  "type": "Page"
  "name": "Graph"
  "text": "In this activity..."
  "panes": [
    "type": "PredefinedGraphPane"
    "title": "Position vs. Time"
    "yLabel": "Position"
    "yUnits": "meters"
    "yMin": 0
    "yMax": 2000
    "yTicks": 10
    "xLabel": "Time"
    "xUnits": "seconds"
    "xMin": 0
    "xMax": 10
    "xTicks": 10
    "data": [
      [0, 0]
      [1, 0]
      [2, 0]
      [3, 1]
      [4, 2]
      [5, 3]
      [6, 4]
      [7, 6]
      [8, 8]
      [9, 10]
      [10, 12]
    ]
  ,
    "type": "TablePane"
  ]
],
"sequence":
  type: "SlopeToolSequence"                  # isn't that a little repetitive? "sequence of type slope tool sequence"
  
  firstQuestionIsSlopeQuestion: true
  firstQuestion: "What is the average velocity of the entire trip from 0 to 10 seconds?"

  # possible choices
  # studentSelectsPoints == false -> points (xMin, yMin), (xMax, yMax) are automatically selected. Slope is known.
  # studentSelectsPoints == true &&
  #   studentMustSelectEndpointsOfRange == true -> points (xMin, yMin) and (xMax, yMax) will be selected by student. Slope is known.
  # studentSelectsPoints == true &&
  #   studentMustSelectEndpointsOfRange == false -> student must select some points within the range xMin..xMax, ymin..yMax. Slope is NOT known unless "slope" is set to some value

  studentSelectsPoints: true  # if 
  studentMustSelectEndpointsOfRange: true
  
  # NOTA BENE
  # if firstQuestionIsSlopeQuestion == true && studentSelectsPoints == true && studentMustSelectEndpointsOfRange == false
  # then we must assume that all the points in the range (xMin, yMin), (xMax, yMax) are collinear. If they are not, the
  # question is ill-posed (there is no unique value of the slope.)
  
  slopeVariableName: "velocity"
  
  xMin: 0
  xMax: 10
  yMin: 0
  yMax: 12
  selectedPointsMustBeAdjacent: false

  tolerance: 0.1
  
"units": [
  "type": "Unit",
  "name": "meters",
  "abbreviation": "m"
,
  "type": "Unit",
  "name": "seconds",
  "abbreviation": "s"
]
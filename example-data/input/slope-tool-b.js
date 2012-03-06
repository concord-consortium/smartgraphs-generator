{
  "type": "Activity",
  "name": "slope_tool_test_b",
  "pages": [
    {
      "type": "Page",
      "name": "Graph",
      "text": "In this activity...",
      "panes": [
        {
          "type": "PredefinedGraphPane",
          "title": "Position vs. Time",
          "yLabel": "Position",
          "yUnits": "meters",
          "yMin": 0,
          "yMax": 10,
          "yTicks": 10,
          "xLabel": "Time",
          "xUnits": "seconds",
          "xMin": 0,
          "xMax": 10,
          "xTicks": 10,
          "data": [[0, 0], [1, 0], [2, 0], [3, 1], [4, 2], [5, 3], [6, 4], [7, 6], [8, 8], [9, 10], [10, 12]]
        }, {
          "type": "TablePane"
        }
      ],
      "sequence": {
        "type": "SlopeToolSequence",
        "firstQuestionIsSlopeQuestion": false,
        "firstQuestion": "Select two points between 3 seconds and 6 seconds.",
        "studentSelectsPoints": true,
        "studentMustSelectEndpointsOfRange": true,
        "slopeVariableName": "velocity",
        "xMin": 3,
        "xMax": 6,
        "yMin": 1,
        "yMax": 4,
        "selectedPointsMustBeAdjacent": false,
        "tolerance": 0.1
      }
    }
  ],
  "units": [
    {
      "type": "Unit",
      "name": "meters",
      "abbreviation": "m"
    }, {
      "type": "Unit",
      "name": "seconds",
      "abbreviation": "s"
    }
  ]
}

This project contains Coffeescript code to convert "high-level", semantic descriptions of Smartgraph activities into
"low-level" JSON that the Smartgraphs runtime (http://github.com/concord-consortium/Smartgraphs) can understand.

We're thinking of developing a node.js module written in Coffeescript so that it can be run on the server-side or packaged for use in a client-side app. In order to simplify the development process, we can start by making a command-line executable, written in Coffeescript, that reads input from the `inputs` folder and outputs to the `outputs` folder. I've included `commander.js` as a node module in order to simplify the creation of an executable with sane option processing.

  * install node.js and the Coffeescript executable `coffee`; see http://jashkenas.github.com/coffee-script/#installation
  * run `npm install` to install [`commander.js`](https://github.com/visionmedia/commander.js/) to the right place
  * look at example command-line utility in `bin/pizza` and run `bin/pizza -h` to see usage

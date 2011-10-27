This project contains Coffeescript code to convert "high-level", semantic descriptions of Smartgraph activities into
"low-level" JSON that the Smartgraphs runtime (http://github.com/concord-consortium/Smartgraphs) can understand.

We're developing a node.js module written in Coffeescript so that it can be run on the server-side or packaged for use in a client-side app. In order to simplify the development process, we can start by making a command-line executable, written in Coffeescript, that reads input from the `inputs` folder and outputs to the `outputs` folder. I've included `commander.js` as a node module in order to simplify the creation of an executable with sane option processing.

  * Clone this repository
  * Install [node.js](http://nodejs.org/) and [npm](http://npmjs.org/)
  * Run `npm install --dev` in the root of the repository to install [commander.js](https://github.com/visionmedia/commander.js/) and [Coffeescript](http://jashkenas.github.com/coffee-script/) sandboxed to this project's `node_modules` folder
  * Look at the example command-line utility `bin/pizza` which uses `src/pizza.coffee`. Run `bin/pizza -h` to see usage and play with `bin/pizza`
  * To run the coffeescript REPL, type `nbin/coffee`
  * The source tree in `src/` is written in Coffeescript and compiled to Javascript in 'lib/'.
  * We are committing the compiled Javascript as we go. Therefore, before editing source files, run `nbin/cake watch` in a separate window to build the Javascript incrementally as you save Coffeescript files. When needed, you can run `nbin/cake build` to build the Javascript code in one go.

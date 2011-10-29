This project contains Coffeescript code to convert "high-level", semantic descriptions of Smartgraph activities into
"low-level" JSON that the Smartgraphs runtime (http://github.com/concord-consortium/Smartgraphs) can understand.

We are developing a Node.js module written in Coffeescript so that it can be run on the server-side or packaged for use in a client-side app. In order to simplify the development process, we can start by making a command-line executable, written in Coffeescript, that reads from and writes to JSON files in the local filesystem. Some example files are kept in the folders `example-data/input` and `example-data/expected-output`. I've included [commander.js](https://github.com/visionmedia/commander.js/) as a node module in order to simplify the creation of an executable with sane option processing.

To get started:

  * Clone this repository.
  * Install [Node.js](http://nodejs.org/) and [npm](http://npmjs.org/).
  * Run `npm install` in the root of the repository to install [commander.js](https://github.com/visionmedia/commander.js/), [Coffeescript](http://jashkenas.github.com/coffee-script/) and [jasmine-node](https://github.com/mhevery/jasmine-node) sandboxed to this project's `node_modules` folder.
  * Look at the example command-line utility `bin/pizza` which uses `src/pizza.coffee`. Run `bin/pizza -h` to see usage and play with `bin/pizza`.
  * To run the coffeescript REPL, type `nbin/coffee`.
  * The source tree in `src/` is written in Coffeescript and compiled to Javascript in 'lib/'.
  * We are committing the compiled Javascript as we go. Therefore, before editing source files, run `nbin/cake watch` in a separate window to build the Javascript incrementally as you save Coffeescript files. When needed, you can run `nbin/cake build` to build the Javascript files in one go.

Tests:

  * Add Jasmine spec tests named `<name>.spec.coffee` to `spec/` directory. There is no need to compile these files to Javascript. However, the tests must have the `.spec.coffee` suffix to be recognized (or `.spec.js`, if they are originally written in Javascript).
  * To run tests, type `nbin/cake test`. To suppress verbose test output and just get a summary, use the `-q` option: `nbin/cake -q test`.
  
To run the converter:

  * (example:) `bin/sg-convert < example-data/input/marias-run.json > example-data/output/marias-run.json`
  
To install as a Node.js package (i.e., as an end user):

  * `npm install -g git://github.com/concord-consortium/smartgraphs-generator.git`
  * If your PATH is set up to use npm-installed executables, this will install the `sg-convert` executable to a location in your PATH. (If you skip the `-g` (`--global`) flag the executable will be installed local to your user.)

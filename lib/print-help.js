const kleur = require("kleur");
const binaryName = require("./binary-name");

module.exports = function printHelp(
  shortDescription,
  longDescription,
  examples
) {
  const binary = binaryName();

  const pkgJson = require("../package.json");

  const output = `${kleur.blue(binary)} - ${kleur.yellow(shortDescription)}

Part of ${pkgJson.name} v${pkgJson.version}.

${kleur.magenta("Description:")}

${longDescription
  .trim()
  .split("\n")
  .map((line) =>
    line.trim().startsWith("#") ? kleur.dim(line.trim()) : line.trim()
  )
  .map((line) => line.replace("@BINARY_NAME@", binary))
  .join("\n")
  .trim()}

${kleur.magenta("Examples:")}

${examples
  .trim()
  .split("\n")
  .map((line) =>
    line.trim().startsWith("#") ? kleur.dim(line.trim()) : line.trim()
  )
  .map((line) => "  " + line.replace("@BINARY_NAME@", binary))
  .join("\n")}

${kleur.magenta(`Other commands from ${pkgJson.name} v${pkgJson.version}:`)}

${Object.entries({
  "@": "pass stdin through a JavaScript function, or run some JavaScript and log the result",
  "@for-each": "evaluate a function once per item in input JSON array",
  "@join": "join a JSON Array with a delimiter",
  "@log": "run some JavaScript and log the result",
  "@map": "map a JSON array into another JSON array, using a function",
  "@split":
    "split stdin on a delimiter, and print the resulting strings as a JSON array",
})
  .map(([key, value]) => "- " + kleur.blue(key) + ": " + kleur.yellow(value))
  .join("\n")}

When passing JavaScript into any of the above commands, the following features
are available:

- When specifying a function on the command line, strings starting with
  "." or ".[" will be compiled into functions that access the cooresponding
  property on their input value. For instance:

  - ".filter(Boolean)" becomes "_ => _.filter(Boolean)"
  - ".some.property" becomes "_ => _.some.property
  - ".[0]" becomes "_ => _[0]

- An \`exec\` function is available in the global namespace which will run the
  string passed into it in a subshell and return its output. For instance:

  - exec("ls")
  - item => exec(\`cp ./src/\${item} ./dist/\${item}\`)

- If you attempt to access a global that isn't defined, we will try to require
  in a module with the same name (using the standard node lookup algorithm
  relative to the current working directory). If that doesn't exist, we will
  convert the name into a plausible module name and attempt to require that.
  
  For instance:

  - accessing "fs" as a global auto-requires the "fs" module
  - accessing "child_process" as a global auto-requires the "child_process"
    module
  - accessing "changeCase" as a global auto-requires the "change-case" module
    (if present in node_modules)
  - accessing "__babel_types" as a global auto-requires the "@babel/types"
    module (if present in node_modules)

- Using the \`require\` function will require things relative to the process's
  current working directory.

- The following string-coloring functions are available in the global namespace
  (they're from the "kleur" module):

  - reset
  - bold
  - dim
  - italic
  - underline
  - inverse
  - hidden
  - strikethrough
  - black
  - red
  - green
  - yellow
  - blue
  - magenta
  - cyan
  - white
  - gray
  - grey
  - bgBlack
  - bgRed
  - bgGreen
  - bgYellow
  - bgBlue
  - bgMagenta
  - bgCyan
  - bgWhite

- The global \`__dirname\` will refer to the current working directory.

To view info about a command run it with \`--help\`, eg \`@join --help\`.
`;

  console.log(output);
  process.exit(0);
};

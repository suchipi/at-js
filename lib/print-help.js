const kleur = require("kleur");
const pkgJson = require("../package.json");

const at = kleur.blue("@");

exports.printHelp = function printHelp() {
  const output = `
${at} - ${kleur.yellow("JavaScript stdio transformation tool")}

From ${kleur.bold(pkgJson.name)}@${kleur.bold(
    pkgJson.version
  )}. Made with ${kleur.red("<3")} by Lily Skye (suchipi).

${kleur.bold().magenta("First time? Read the --tutorial!")}

${kleur.bold("USAGE")}

  [input |] @ [options] <expression>

  Where:
  - 'input' is a command that prints to stdout
  - 'options' refers to any command-line options, as described below
  - 'expression' should be a string of JavaScript code

${kleur.bold("EXAMPLES")}

  ${kleur.dim(
    "# Make a markdown list out of all the files in the current working directory"
  )}
  ls | ${at} '.trim().split("\\n")' | ${at} -t '*' 'l => "- " + l' | ${at} '.join("\\n")'

  ${kleur.dim("# Print colored/styled text")}
  echo "Hello!" | ${at} 'green().bold'

  ${kleur.dim("# Print the exports of a module")}
  ${at} reactDom ${kleur.dim('# Attempts to auto-require "react-dom"')}

${kleur.bold("OPTIONS")}

  --help, -h:           Show this text

  --tutorial:           Print detailed help and information about ${at}

  --target, -t:         Specify which object(s) in the input data to run the
                        JavaScript function on, eg '.users[0].name'. You can
                        use '*' as a wildcard to target multiple objects.

                        When unspecified, the JavaScript function will be run
                        on the entire input.
  
  The following options all are forwarded to node's util.inspect function,
  which is used when ${at} outputs data that isn't JSON-serializable.

  --depth:              How many nested objects/arrays/etc to expand in the
                        printed output. Defaults to 2.
  
  --colors:             Whether to use ANSI escape sequences to color the
                        output text. Defaults to true.
  
  --max-array-length:   How many items to show in an array before truncating
                        it. Defaults to 100.
  
  --max-string-length:  How many characters to show in a string before
                        truncating it. Defaults to 10000.
`;

  console.log(output.trim() + "\n");
};

exports.printTutorial = function printDetailedInfo() {
  const highlight = require("@babel/highlight").default;

  const output = `
${at} - ${kleur.yellow("JavaScript stdio transformation tool")}

From ${kleur.bold(pkgJson.name)}@${kleur.bold(
    pkgJson.version
  )}. Made with ${kleur.red("<3")} by Lily Skye (suchipi).

${kleur
  .bold()
  .underline()
  .magenta(
    "Overview                                                                        "
  )}

${at} (read as 'at') is a flexible command-line program used to read, iterate over,
transform, and create text.

${at} achieves this by leveraging:

- Unix stdio streams
- JSON (de)serialization
- and JavaScript evaluation

It's suitable for use-cases such as:

- Executing a CLI command once for each file in the current directory

- Transforming lines of text from one format into another (change colons into
  equals signs, remove prefixes/suffixes from each line, etc)

- Parsing an arbitrary text structure into JSON

- Formatting and printing the data in a JSON file as human-readable text,
  with colors

The goal of ${at} is to make text transformation and file iteration easier to do
on the command-line. It supercharges the sed/awk/grep/xargs workflow by
exposing the full power of JavaScript in a way that doesn't require writing .js
files or learning Node.js APIs.

${kleur
  .bold()
  .underline()
  .magenta(
    "Basic Usage                                                                     "
  )}

Here's how it works:

- When you pipe into ${at}, it gathers all of the data it receives on stdin as a
  string.

- If that string contains JSON, it parses it into a JSON object.

- Then, it passes your input string/object into a JavaScript function, that
  you provide on the command-line.

- Finally, the result of your function is written to stdout.

Here's an example of what it looks like:

${kleur.blue("ls")} ${kleur.green("|")} ${at} ${kleur.yellow(
    `'data => data.split("\\n")'`
  )}

This command line does the following:
- lists all the files in the current working directory (${kleur.blue("ls")})
- pipes (${kleur.green("|")}) the output of that command into ${at}
- instructs ${at} to transform that input string by using
  the JavaScript function '${highlight('data => data.split("\\n")')}'.
- prints the result of that function to stdout.

The function receives that input data as a string, and because it uses the
string's "split" method, it returns an Array.

Whenever the function you give to ${at} returns something other than a string,
${at} checks if that object can be represented using JSON without losing any
important information.

If so, then ${at} will use JSON.stringify on it prior to printing it to stdout.
As such, the above command line will output something like this:

[
  ${kleur.yellow('"bin"')},
  ${kleur.yellow('"lib"')},
  ${kleur.yellow('"LICENSE"')},
  ${kleur.yellow('"node_modules"')},
  ${kleur.yellow('"package.json"')},
  ${kleur.yellow('"package-lock.json"')},
  ${kleur.yellow('"README.md"')},
  ${kleur.yellow('""')}
]

Because ${kleur
    .bold()
    .blue("@")} will automatically parse any JSON it receives as
input, this output can be piped into ${at} ${kleur.italic("again")} to transform
it further:

${kleur.blue("ls")} ${kleur.green("|")} ${at} ${kleur.yellow(
    `'data => data.split("\\n")'`
  )} ${kleur.green("|")} ${at} ${kleur.yellow(`'data => data.slice(0, 3)'`)}

The above command line passes the resulting array back into ${at} again, where
it gets sliced into a subarray containing the first 3 items. As such, the above
command line would output:

[
  ${kleur.yellow('"bin"')},
  ${kleur.yellow('"lib"')},
  ${kleur.yellow('"LICENSE"')}
]

${kleur
  .bold()
  .underline()
  .magenta(
    "Features, or: How To Make Code In Strings Not Terrible                          "
  )}

You might be thinking:

${kleur.bold().dim("|")} ${kleur.italic('"I dunno, that looks kinda janky"')}

And if so, I wouldn't blame you. I'll be the first to admit that writing
JavaScript expressions embedded inside single-quoted shell strings isn't
exactly a great experience.

However, I felt the idea of combining the shell and JavaScript was still really
enticing. So, I designed ${at}'s API with the goal of improving that experience as
much as possible.

In order to facilitate that, I added several features to ${at}:

${kleur.bold().underline(" ".repeat(80))}

${kleur.magenta(
  "1."
)} ${kleur.bold(`If your input function string starts with ${kleur.yellow(
    "'.'"
  )}, it'll automatically be
   prefixed with ${kleur.yellow("'$it => $it'")}.`)}
${kleur.bold().underline(" ".repeat(80))}

Therefore, instead of writing this:

${kleur.blue("ls")} ${kleur.green("|")} ${at} ${kleur.yellow(
    `'data => data.split("\\n")'`
  )} ${kleur.green("|")} ${at} ${kleur.yellow(`'data => data.slice(0, 3)'`)}

You can write this:

${kleur.blue("ls")} ${kleur.green("|")} ${at} ${kleur.yellow(
    `'.split("\\n")'`
  )} ${kleur.green("|")} ${at} ${kleur.yellow(`'.slice(0, 3)'`)}

This can also be used to access nested properties on an object:

${kleur.blue("cat")} package.json ${kleur.green("|")} ${at} ${kleur.yellow(
    `'.version'`
  )}


${kleur.bold().underline(" ".repeat(80))}

${kleur.magenta("2.")} ${kleur.bold(
    `If your input function string starts with ${kleur.yellow(
      "'.['"
    )}, that ${kleur.yellow("'.['")} will be replaced
   with ${kleur.yellow("'$it => $it['")}.`
  )}
${kleur.bold().underline(" ".repeat(80))}

This is similar to feature #1; it gives you the same conveniences, but for
number keys and computed property access:

${kleur.blue("ls")} ${kleur.green("|")} ${at} ${kleur.yellow(
    `'.split("\\n")'`
  )} ${kleur.green("|")} ${at} ${kleur.yellow(`'.[0].toUpperCase()'`)}


${kleur.bold().underline(" ".repeat(80))}

${kleur.magenta("3.")} ${kleur.bold(
    `If your input function string doesn't start with a property access, but
   contains ${kleur.yellow("$it")}, it will be prefixed with ${kleur.yellow(
      "'$it => '"
    )}.`
  )}
${kleur.bold().underline(" ".repeat(80))}

This provides the benefits of features #1 and #2 to any expression, though it's
a bit harder to understand at a glance.

${kleur.blue("ls")} ${kleur.green("|")} ${at} ${kleur.yellow(
    `console.log($it)`
  )}


${kleur.bold().underline(" ".repeat(80))}

${kleur.magenta("4.")} ${kleur.bold(
    `You can use ${kleur.magenta("--target")} or ${kleur.magenta(
      "-t"
    )} to apply the function to only the value found at a
   specific property path, ${kleur.italic(
     `and you can use ${kleur.red("*")} as a wildcard.`
   )}`
  )}
${kleur.bold().underline(" ".repeat(80))}

This reduces the amount of boilerplate code needed to access and modify
structures. For instance, given this data structure:
${highlight(`
[
  {
    label: "Pizza",
    tags: ["italian", "cheese", "umami"],
  },
  {
    label: "Ice Cream",
    tags: ["dessert", "cold", "sweet"],
  },
  {
    label: "Red Bean Buns",
    tags: ["snack", "warm", "sweet"],
  },
]
`)}
If you wanted to capitalize the first letter of each tag, you might need to
write a function like this:
${highlight(`
(input) =>
  input.map((food) => ({
    ...food,
    tags: food.tags.map((tag) => tag[0].toUpperCase() + tag.slice(1)),
  }));
`)}

Which is a really long function to write on the command-line, with lots of
opportunity for mismatched parentheses and brackets.

Instead, you can use ${kleur.magenta(
    "--target"
  )} to point the function at multiple deep object
property paths in the data structure:

${at} --target '*.tags.*' 'tag => tag[0].toUpperCase() + tag.slice(1)'


${kleur.bold().underline(" ".repeat(80))}

${kleur.magenta("5.")} ${kleur.bold(
    `${at} makes several helpful globals available to your function.`
  )}
${kleur.bold().underline(" ".repeat(80))}

Node.js has a lot of powerful APIs; for instance, the ${kleur.yellow(
    "child_process"
  )} API
is super useful for spawning subprocesses and subshells. However, it's not
really suitable for use in small function strings on the command line. As such,
${at} offers an alternative: the ${kleur.bold("exec")} function.

${kleur.bold(
  "exec"
)} is a wrapper around Node.js's child_process.spawnSync function. It's
available as a global inside of functions you pass to ${at}.

If you call it with a string:
${highlight(`
exec("echo hi")
`)}
It'll run that command in a subshell, then return its stdout as a string.

Additionally, if the command exits with a nonzero status code, ${kleur.bold(
    "exec"
  )}
will throw an Error with the stdout/stderr/code of the command.

You can also call it with multiple strings:
${highlight(`
exec("echo", "hi")
`)}
And it will join all those strings together with a space between each, then run
the joined string as a command.

The string returned from ${kleur.bold("exec")} also has three properties on it:
${highlight(`
exec("echo", "hi").stdout // What was written to stdout; string.
exec("echo", "hi").stderr // What was written to stderr; string.
exec("echo", "hi").code // The exit status code; number.
`)}

${at} also creates a global alias for JSON.stringify: ${kleur.bold("quote")}.
${highlight(`
quote("hello") // returns '"hello"'
`)}
${kleur.bold("quote")} can be useful when working with filenames that might
have a space in them:
${highlight(`
file => exec("cp", quote(file), quote(file + ".bak"))
`)}
${at} also makes all of the functions from the ${kleur.bold(
    "kleur"
  )} package available as
globals:

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

These functions can be used to style text and change its color:
${highlight(`
bold("IMPORTANT")`)}
${highlight(`
red("FAILURE")`)}
${highlight(`
bold(green("SUCCESS!"))`)}

${kleur.bold().underline(" ".repeat(80))}

${kleur.magenta("6.")} ${kleur.bold(
    `${at} will automatically attempt to call require on your behalf if you access an
   undefined global.`
  )}
${kleur.bold().underline(" ".repeat(80))}

Libraries in your local ${kleur.yellow("node_modules")} folder can be super
helpful, but trying to write a 'require' call inside of a shell string can be
a little inconvenient; you have to make sure to use a different quote from the
one you're wrapping your entire function with, or else you'll have to escape
stuff, and.... it just gets dicey.

So, ${at} will do its best to automatically require node modules for you.
Here's some examples of what it can do:

- accessing "fs" as a global auto-requires the "fs" module
- accessing "child_process" as a global auto-requires the "child_process"
  module
- accessing "changeCase" as a global auto-requires the "change-case" module
  (if present in node_modules)
- accessing "__babel_types" as a global auto-requires the "@babel/types"
  module (if present in node_modules)

The general rule is that you should write your module name using camelCase
instead of kebab-case. In the case of scoped packages, you should replace
the @ sign with two underscores, and the slash with one underscore (this is the
same convention that the @types stuff on npm uses).


${kleur.bold().underline(" ".repeat(80))}

Hopefully that was informative and helpful! :D
`;

  console.log(output.trim() + "\n");
};

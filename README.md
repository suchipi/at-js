# `@suchipi/at-js`

> Unix command-line utilities for working with data

This package provides a bunch of binaries starting with `@` that you can use to compose stdio pipes together with JavaScript/JSON.

This is what it looks like:

```sh
# Split the stdout of ls on newline, remove empty lines, then convert each to uppercase. A JSON array will be printed
ls | @split "\n" | @filter 'filepath => filepath != ""' | @map "filepath => filepath.toUpperCase()"

# Read package.json's name field, then convert it to upper case
cat package.json | @ .name | @ ".toUpperCase()" # shorthand for "_ => _.toUpperCase()"

# Loading and transforming something from a local file:
@ "Object.keys(require('./data.js'))"

# Running a command in a subshell. @split -n filters out an empty trailing array element, if present.
ls | @split "\n" -n | @map 'filepath => exec(`cp ./${filepath} ./tmp/${filepath}`)'

# Generates a markdown list from the output of ls:
ls | @split -n "\n" | @map 'filepath => `- ${filepath}`' | @join "\n"

# Generates a markdown list from the output of ls, and copies it to the clipboard:
ls | @split -n "\n" | @map 'filepath => `- ${filepath}`' | @join "\n" | pbcopy # macOS
ls | @split -n "\n" | @map 'filepath => `- ${filepath}`' | @join "\n" | xclip -sel clip # Linux, BSD, etc. you might have to install xclip

# Print the export of a module (uses util.inspect):
@log 'require("kleur")'
@log --depth Infinity --colors false 'require("kleur")'

# Additionally, accessing undefined globals will attempt to auto-require them:
@log 'fs' # auto-requires node's fs builtin
@log 'kleur' # auto-requires kleur, relative to the current working directory
@log 'changeCase' # auto-requires change-case, relative to the current working directory
@log '__babel_types' # auto-requires @babel/types, relative to the current working directory
```

## Installation

```
npm install -g @suchipi/at-js
```

## List of commands

- `@`: pass stdin through a JavaScript function, or run some JavaScript and log the result
- `@for-each`: evaluate a function once per item in input JSON array
- `@join`: join a JSON Array with a delimiter
- `@log`: run some JavaScript and log the result
- `@map`: map a JSON array into another JSON array, using a function
- `@split`: split stdin on a delimiter, and print the resulting strings as a JSON array

Run any command with `--help` for more info.

## License

MIT

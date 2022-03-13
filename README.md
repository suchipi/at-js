# `@suchipi/at-js`

> `@` - JavaScript stdio transformation tool

## Example

```
cat package.json | @ .dependencies | @ Object.keys | @ '.join("\n")'
```

## Installation

```
npm install -g @suchipi/at-js
```

## Full Description

```
@ - JavaScript stdio transformation tool

From @suchipi/at-js@0.3.1. Made with <3 by Lily Scott (suchipi).

Overview

@ (read as 'at') is a flexible command-line program used to read, iterate over,
transform, and create text.

@ achieves this by leveraging:

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

The goal of @ is to make text transformation and file iteration easier to do
on the command-line. It supercharges the sed/awk/grep/xargs workflow by
exposing the full power of JavaScript in a way that doesn't require writing .js
files or learning Node.js APIs.

Basic Usage

Here's how it works:

- When you pipe into @, it gathers all of the data it receives on stdin as a
  string.

- If that string contains JSON, it parses it into a JSON object.

- Then, it passes your input string/object into a JavaScript function, that
  you provide on the command-line.

- Finally, the result of your function is written to stdout.

Here's an example of what it looks like:

ls | @ 'data => data.split("\n")'

This command line does the following:
- lists all the files in the current working directory (ls)
- pipes (|) the output of that command into @
- instructs @ to transform that input string by using
  the JavaScript function 'data => data.split("\n")}'.
- prints the result of that function to stdout.

The function receives that input data as a string, and because it uses the
string's "split" method, it returns an Array.

Whenever the function you give to @ returns something other than a string,
@ checks if that object can be represented using JSON without losing any
important information.

If so, then @ will use JSON.stringify on it prior to printing it to stdout.
As such, the above command line will output something like this:

[
  "bin",
  "lib",
  "LICENSE",
  "node_modules",
  "package.json",
  "package-lock.json",
  "README.md",
  ""
]

Because @ will automatically parse any JSON it receives as
input, this output can be piped into @ again to transform
it further:

ls | @ 'data => data.split("\n")' | @ 'data => data.slice(0, 3)'

The above command line passes the resulting array back into @ again, where
it gets sliced into a subarray containing the first 3 items. As such, the above
command line would output:

[
  "bin",
  "lib",
  "LICENSE"
]

Features, or: How To Make Code In Strings Not Terrible

You might be thinking:

| "I dunno, that looks kinda janky"

And if so, I wouldn't blame you. I'll be the first to admit that writing
JavaScript expressions embedded inside single-quoted shell strings isn't
exactly a great experience.

However, I felt the idea of combining the shell and JavaScript was still really
enticing. So, I designed @'s API with the goal of improving that experience as
much as possible.

In order to facilitate that, I added several features to @:


1. If your input function string starts with '.', it'll automatically be
   prefixed with 'input => input'.


Therefore, instead of writing this:

ls | @ 'data => data.split("\n")' | @ 'data => data.slice(0, 3)'

You can write this:

ls | @ '.split("\n")' | @ '.slice(0, 3)'

This can also be used to access nested properties on an object:

cat package.json | @ '.version'



2. If your input function string starts with '.[', that '.[' will be replaced
   with 'input => input['.


This is similar to feature #1; it gives you the same conveniences, but for
number keys and computed property access:

ls | @ '.split("\n")' | @ '.[0].toUpperCase()'



3. You can use --target or -t to apply the function to only the value found at a
   specific property path, and you can use * as a wildcard.


This reduces the amount of boilerplate code needed to access and modify
structures. For instance, given this data structure:

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

If you wanted to capitalize the first letter of each tag, you might need to
write a function like this:

input => input.map(food => {
  ...food, tags: food.tags.map(tag => tag[0].toUpperCase() + tag.slice(1))
})


Which is a really long function to write on the command-line, with lots of
opportunity for mismatched parentheses and brackets.

Instead, you can use --target to point the function at multiple deep object
property paths in the data structure:

@ --target '*.tags.*' 'tag => tag[0].toUpperCase() + tag.slice(1)'



4. @ makes several helpful globals available to your function.


Node.js has a lot of powerful APIs; for instance, the child_process API
is super useful for spawning subprocesses and subshells. However, it's not
really suitable for use in small function strings on the command line. As such,
@ offers an alternative: the exec function.

exec is a wrapper around shelljs's exec function. It's available as
a global inside of functions you pass to @.

If you call it with a string:

exec("echo hi")

It'll run that command in a subshell, then return its stdout as a string.

Additionally, if the command exits with a nonzero status code, exec
will throw an Error with the stdout/stderr/code of the command.

You can also call it with multiple strings:

exec("echo", "hi")

And it will join all those strings together with a space between each, then run
the joined string as a command.

The string returned from exec also has three properties on it:

exec("echo", "hi").stdout // What was written to stdout; string.
exec("echo", "hi").stderr // What was written to stderr; string.
exec("echo", "hi").code // The exit status code; number.


@ also creates a global alias for JSON.stringify: quote.

quote("hello") // returns '"hello"'

quote can be useful when working with filenames that might
have a space in them:

file => exec("cp", quote(file), quote(file + ".bak"))

@ also makes all of the functions from the kleur package available as
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

bold("IMPORTANT")

red("FAILURE")

bold(green("SUCCESS!"))


5. @ will automatically attempt to call require on your behalf if you access an
   undefined global.


Libraries in your local node_modules folder can be super
helpful, but trying to write a 'require' call inside of a shell string can be
a little inconvenient; you have to make sure to use a different quote from the
one you're wrapping your entire function with, or else you'll have to escape
stuff, and.... it just gets dicey.

So, @ will do its best to automatically require node modules for you.
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
```

## License

MIT

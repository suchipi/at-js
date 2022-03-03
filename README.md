# `@suchipi/at-js`

Unix command-line utilities for working with data

This package provides a bunch of binaries starting with `@` that you can use to compose stdio pipes together with JavaScript/JSON.

This is what it looks like:

```sh
$ ls | @split "\n" | @filter Boolean | @map "p => p.toUpperCase()"


# or:
cat package.json | jq .name | @ "s => s.toUpperCase()"
```

## Installation

```
npm install -g @suchipi/at-js
```

## List of commands

- `@` - pass stdin through a JavaScript function
- `@call` - parse stdin as JSON, then call a method on it
- `@for-each` - evaluate a function once per item in input JSON array
- `@join` - join a JSON Array with a delimiter
- `@map` - map a JSON array into another JSON array, using a function
- `@split` - split stdin on a delimiter, and print the resulting strings as a JSON array

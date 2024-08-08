tiddlycsv is a small, streaming CSV parser.
It's about ~1kb, has zero dependencies, and is tree-shakable.

Doesn't care about headers, keyed rows, anything but strings. Just supports the CSV spec including multi-line and quoted strings.

## Usage

Install `tiddlycsv`.
Includes types.

### Methods

- `parseCSV`: parses a whole string CSV into an array of arrays

- `iterCSV`: returns a `Generator` for each line of a whole string CSV

- `streamCSV`: returns a `ReadableStream` for each line of a streaming CSV

- `streamCSVChunk`: returns a `ReadableStream` for chunks of the streaming CSV (faster)

- `buildCSVChunkStreamer`: builds a low-level function which converts incoming CSV data into rows

- `writeCSV`: simple method that converts array data into CSV string output (call multiple times to "stream")

In general, if the read helpers don't work for you, use `buildCSVChunkStreamer` and provide data your way.
Minifying that method only is about ~0.5k.

## Speed

It's very fast.
To parse multiple copies of [1.csv](https://github.com/Keyang/csvbench/blob/master/1.csv):

```
tiddlycsv: 689.38ms
but-csv: 732.419ms (1.06x)
papaparse: 1.083s (1.57x)
```

## Output

Unlike other parsers, `tiddlycsv` will return empty strings for trailing commas and empty lines.
For the input data:

```csv
Name,Age
Sam,37
Jim,

Anne,56
```

You'll get results like:

```json
[["Name", "Age"], ["Sam", "37"], ["Jim", ""], [""], ["Anne", "56"]]
```

Should this be configurable?
Maybe!

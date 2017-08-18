#!/usr/bin/env node

const cli = require('cli')
const fs = require('fs')
const parse = require('csv-parse/lib/sync')
const spawn = require('child_process').spawnSync

cli.enable('version')
cli.setUsage(cli.app + ' [options] file.csv')
cli.parse({
  csvDelimiter: ['d', 'Set the field delimiter. One character only.', 'string', ','],
  genAll: ['a', 'Generate an all.json file with the content of everything in the input.csv'],
  genIndex: ['i', 'Generate an index inside of the folder with every identifier in a json array'],
  output: ['o', 'Output path of the created files', 'dir', 'public'],
  quote: ['q', 'Optional character surrounding a field. One character only. Disabled if null, false or empty.', 'string', '"'],
  rebuild: ['r', 'Delete files in output path before creation']
})

if (cli.args.length < 1) { // must contain one or more file.csv
  cli.getUsage()
  process.exit(1)
}

function load(filename) {
  const data = fs.readFileSync(filename, 'utf8')
  const t1 = parse(data, {
    auto_parse: true,
    columns: true,
    delimiter: cli.options.csvDelimiter,
    quote: cli.options.quote
  })
  return t1
}

function startGeneration(files) {
  if (cli.options.rebuild) {
    spawn('rm', ['-rf', cli.options.output])
  }

  for (let i = 0; i < files.length; i++) {
    generateFromFilename(files[i])
    console.log(files[i], 'done')
  }

  if (cli.options.genIndex) {
    const folders = files.map(o => o.replace('.csv', ''))
    fs.writeFileSync(cli.options.output + '/index.json', JSON.stringify(folders), 'utf8')
  }
}

function generateFromFilename(filename) {
  const name = filename.replace('.csv', '')
  const folder = cli.options.output + '/' + name
  const entries = load(filename)

  generate(name, folder, entries)
}

function generate(name, folder, entries) {
  spawn('mkdir', ['-p', folder])

  if (cli.options.genAll) {
    fs.writeFileSync(folder + '/all.json', JSON.stringify(entries), 'utf8')
  }

  if (entries.length) {
    const fileIdentifier = Object.keys(entries[0])[0]

    entries.forEach(o => {
      fs.writeFileSync(folder + '/' + o[fileIdentifier] + '.json', JSON.stringify(o), 'utf8')
    })

    if (cli.options.genIndex) {
      const ids = entries.map(o => o[fileIdentifier])
      fs.writeFileSync(folder + '/index.json', JSON.stringify(ids), 'utf8')
    }
  }
}

startGeneration(cli.args)

'use strict'

const readline = require('readline')
const path = require('path')
const fs = require('fs')
const csv = require('fast-csv')

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = text => {
  return new Promise(resolve => {
    readlineInterface.question(text, answer => {
      resolve(answer)
    })
  })
}

const parseCSV = (location, type, fieldsLength) => {
    return new Promise((resolve, reject) => {
        let goodRecords = []
        let badRecords = []
        let header = true
        const lowerCaseType = type.toLowerCase()
        const delimiter = lowerCaseType === 'csv' ? ',' : lowerCaseType === 'tsv' ? '\t' : 'error'
        const fieldsCount = parseInt(fieldsLength)
        

        if(!fs.existsSync(location)){
          reject(`The file location "${location}" does not contain a file. Canceling process.`)
        }
        if(delimiter === 'error'){
          reject(`${delimiter} is not a csv or tsv file. Canceling process.`)
        }
        if(delimiter === '\t'){
          reject('tsv files are currently not supported. Canceling process.')
        }
        if(isNaN(fieldsCount)){
          reject('You must input a integer for the fields count. Canceling process.')
        }
        csv.parseFile(location, { delimiter })
          .on('data', row => {
            if(header){
              header = false
              return
            }
            if(row.length !== fieldsCount){
              badRecords.push(row)
              return
            }
            goodRecords.push(row) 
          })
          .on('error', error => {
            reject(error)
          })
          .on('end', () => resolve([goodRecords, badRecords]))
    })
}

const exportFile = (data, fileName) => {
  csv.writeToPath(path.resolve(__dirname, fileName), data)
      .on('error', error => console.error(error))
      .on('finish', () => console.log(`Saved ${fileName}`))
}

const main = async () => {
    const location = await question('Where is this file located? ')
    const type = await question('Is the file format CSV (comma-separated values) or TSV (tab-separated values)? ')
    const fields = await question('How many fields should each record contain? ')
    readlineInterface.close()

    try {
      const [goodRecords, badRecords] = await parseCSV(location, type, fields)
      exportFile(goodRecords, `correct.${type}`)
      exportFile(badRecords, `incorrect.${type}`)

    } catch(error){
      console.log(error)
    }
}

main()

'use strict'

const readline = require('readline')
const path = require('path')
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
        const lowerCaseType = type.toLowerCase()
        
        const delimiter = lowerCaseType === 'csv' ? ',' : lowerCaseType === 'tsv' ? '\t' : 'error'
        const length = parseInt(fieldsLength)
        if(delimiter === 'error'){
          reject(`${delimiter} is not a csv or tsv. Canceling process.`)
        }
        
        if(isNaN(length)){
          reject('You must input a integer for the fields count. Canceling process.')
        }
        csv.parseFile(location, { delimiter })
        .validate(data => {
          console.log(data.length, length, data, delimiter)
          if(data.length !== length){
            return false
          }
          return true
         })
        .on('error', error => {
          reject(error)
        })
        .on('data', row => goodRecords.push(row))
        .on('data-invalid', row => badRecords.push(row))
        .on('end', () => resolve([goodRecords, badRecords]))
    })
}

const exportFile = (data, fileName) => {
  csv.writeToPath(path.resolve(__dirname, fileName), data)
      .on('error', error => console.error(error))
      .on('finish', () => console.log(`Saved ${fileName}`))
}

const main = async () => {
    const location = await question('Where is this file located?')
    const type = await question('Is the file format CSV (comma-separated values) or TSV (tab-separated values)?')
    const fields = await question('How many fields should each record contain?')
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
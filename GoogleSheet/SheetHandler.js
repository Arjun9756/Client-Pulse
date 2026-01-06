const { google } = require('googleapis')
const dotenv = require('dotenv')
const {Queue} = require('bullmq')
const path = require('path')

dotenv.config({
  path: path.join(__dirname, '..', '.env')
})

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '..', 'Credentials', 'GoogleSheet_API_Credentials.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const queue = new Queue('Users' , {
  connection:{
    host:process.env.REDIS_HOST,
    password:process.env.REDIS_PASSWORD,
    port:process.env.REDIS_PORT
  }
})

/*

Create the authentication object auth for google verification with pass es keyfiles and defined its score at any
function read and wirte first create the the clinet await auth.getClient() after that create an sheet = google.sheet({version , client})
after that get the spread id and sheetname to make manipulation then for reading defined the range from sheename start cel to column cell
for writing define sheetname coum name and index 
 the use sheets spreadsheet ke andeder se values ke ander se value get karo or for reding pass id and range for update
 paass the id and range and resources ek object ke ander values in 2d array array valueInputOption : Raw 

*/

async function readSheetData()
{
  const client = await auth.getClient()
  const sheets = google.sheets({version:"v4" , auth:client})

  const spreadSheetId = process.env.SPREADSHEETID
  const sheetName = process.env.SHEETNAME

  const range = `${sheetName}!A1:I`
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId:spreadSheetId,
    range:range
  })

  const rows = response.data.values
  const header = rows[0];

  const dataRows = rows.slice(1)
  const pendingRows = dataRows.filter(row => row[5]?.trim().toUpperCase() === 'PENDING')

  console.log(rows)

  for(let x of pendingRows)
  {
    console.log(x)
    await queue.add('user' , {
      'ProductName':x[0],
      'ProductDetails':x[1],
      'Gmail':x[2],
      'Contact':x[3],
      'UserId':x[4],
      'Status':x[5],
      'Summary':x[6],
      'Service':x[7],
      'UserName':x[8] || 'Unknown User'
    })
  }
}
readSheetData()
module.exports = readSheetData // Async Function
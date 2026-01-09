const fs = require('fs')
const path = require('path')

function appendLogMetrics(loggerInfo , logReason){
    if(!fs.existsSync(path.join(__dirname , ".." , "logMetrics.txt"))){
        fs.writeFileSync(path.join(__dirname , ".." , "logMetrics.txt") , "" , {
            encoding:"utf-8"
        })
    }

    fs.appendFile(path.join(__dirname , ".." , "logMetrics.txt") , `\n [${new Date().toDateString()}] ${loggerInfo} -> ${logReason}` , {
        encoding:"utf-8",
    })
    return
}

module.exports = appendLogMetrics
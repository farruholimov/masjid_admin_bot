const request = require("request")
const fs = require("fs")
const path = require("path")
const configs = require('../config')

module.exports.fileDownloader = async function(file, file_id){
    try {
        let url = `http://api.telegram.org/file/bot${configs.TG_TOKEN}/${file.file_path}`

        request.head(url, (err, res, body) => {
            request(url).pipe(fs.createWriteStream(path.join(__dirname, "..", "uploads", "files", file_id + ".jpg"))).on('close', () => {});
          });
    } catch (error) {
        console.log("Downloader error",error);
    }
}
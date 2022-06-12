const { default: fetch } = require("node-fetch")
const { API_URL: baseUrl } = require("../config")

async function fetchUrl(url, method = "GET", body = {}){
    try {
        if (!method) {
            throw new Error("Method is undefined")
        }
        let options = {
            method: method,
            headers: {
                "Content-Type": "application/json"
            }
        }
        
        if (method != "GET") {
            options.body = JSON.stringify(body)
        }
        
        let response = await fetch(`${baseUrl}${url}`, options)

        response = await response.json()

        return response
    } catch (error) {
        console.log(error);
    }
}

module.exports = fetchUrl
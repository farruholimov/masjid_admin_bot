const { compareSync } = require("bcrypt")
const { hashSync } = require("bcrypt")
const { genSalt, hash, compare } = require("bcrypt")

module.exports.createCrypt = (password) => {
    return hashSync(password, 10)
}

module.exports.compareCrypt = (password, data) => {
    return compareSync(password, data)
}
const ErrorResponse = require("../../modules/error/errorResponse")

module.exports.errorMiddleware = (req, res, next) => {
    res.error = ErrorResponse
    next()
}
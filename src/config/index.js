require('dotenv').config()
const { env } = require('process');

const configs = {
    PORT: env.PORT,
    PASSWORD: env.PASSWORD,
    TG_TOKEN: env.TG_TOKEN,
    ADMIN_ID: Number(env.ADMIN_ID),
    API_URL: env.BASE_API
}

module.exports = configs;

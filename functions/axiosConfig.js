const axios = require("axios"); 
const config = require("../config.json");

const instance = axios.create({
    headers: { "X-Riot-Token": config.api.riot.key }
});

module.exports = instance;
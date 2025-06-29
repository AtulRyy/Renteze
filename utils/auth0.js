// utils/auth0.js
const axios = require('axios');
require('dotenv').config();

async function getAuth0Token() {
    const res = await axios.post(`${process.env.BASEURL}/oauth/token`, {
        client_id: process.env.CLIENTID,
        client_secret: process.env.SECRET,
        audience: `${process.env.BASEURL}/api/v2/`,
        grant_type: 'client_credentials'
    });
    return res.data.access_token;
}

module.exports = { getAuth0Token };

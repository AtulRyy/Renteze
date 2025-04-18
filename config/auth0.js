const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');
const app = express();
require('dotenv').config()

const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: process.env.BASEURL,
  clientID: process.env.CLIENTID,
  issuerBaseURL: process.env.ISSUER,
  secret: process.env.SECRET
};

// The `auth` router attaches /login, /logout
// and /callback routes to the baseURL
const auth0=auth(config)

module.exports={auth0}






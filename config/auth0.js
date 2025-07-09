const express = require('express');
const { auth } = require('express-openid-connect');
const app = express();
require('dotenv').config();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.JWT_TOKEN,          
  baseURL: process.env.BASEURL,           
  clientID: process.env.AUTH0_CLIENT_ID,  
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`, 
  clientSecret: process.env.AUTH0_CLIENT_SECRET,        
};

const auth0 = auth(config);

module.exports = { auth0 };

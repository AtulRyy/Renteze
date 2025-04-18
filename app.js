const express=require('express')
const app=express()
const path =require('path')
const {auth0}=require(`./config/auth0`);
const { requiresAuth } = require('express-openid-connect');
const checkNewUser = require('./middleware/checkNewUser');
const connectDB = require('./config/mongodb');

connectDB()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(auth0)
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(express.json()); // for JSON body requests


// ROUTES
const dashboardRoute=require('./routes/dashboardRoute')
const profileCompletionRoute=require('./routes/profileCompletionRoute')
const createPropertyRoute=require('./routes/createPropertyRoute')
const createUnitRoute=require('./routes/createUnit')
const viewPropertyRoute=require('./routes/viewProperty')
const viewUnitRoute=require('./routes/viewUnit')


app.use('/dashboard',dashboardRoute)
app.use('/complete-profile',profileCompletionRoute)
app.use('/create-property',createPropertyRoute)
app.use('/create-room',createUnitRoute)
app.use('/property',viewPropertyRoute)
app.use('/unit',viewUnitRoute)



app.get('/', (req, res) => {
    res.send(
      req.oidc.isAuthenticated() 
        ? `<h2>Welcome back, ${req.oidc.user.name}!</h2><a href="/dashboard">Dashboard</a> <a href="/logout">Logout</a>`
        : `<h2>You are logged out</h2><a href="/login">Owner Login</a><br><br><a href="/tenant-login">Tenant Login</a>`
    );
  });


app.listen(3000,()=>{
    console.log(`Server is listening on port ${3000}\nhttp://localhost:3000`);
    
})
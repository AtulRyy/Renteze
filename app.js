const express = require('express');
const app = express();
const path = require('path');
const { auth0 } = require('./config/auth0');
const { requiresAuth } = require('express-openid-connect');
const checkNewUser = require('./middleware/checkNewUser');
const connectDB = require('./config/mongodb');
const cors = require('cors');

// Connect to MongoDB
connectDB();

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'https://renteze-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(auth0);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/assets', express.static('assets'));
app.use('/uploads', express.static('uploads'));
app.use('/invoices', express.static('invoices'));

// Routes
const dashboardRoute = require('./routes/dashboardRoute');
const profileCompletionRoute = require('./routes/profileCompletionRoute');
const createPropertyRoute = require('./routes/createPropertyRoute');
const createUnitRoute = require('./routes/createUnit');
const viewPropertyRoute = require('./routes/viewProperty');
const viewUnitRoute = require('./routes/viewUnit');
const addTenantRoute = require('./routes/addTenantRoute');
const inviteTenantRoute = require('./routes/inviteTenantRoute');
const tenantRoute = require('./routes/tenantRoute');
const rentPaymentsRoutes = require('./routes/rentPayments');
const uploadTenantsRoute = require('./routes/uploadTenants'); // ✅ CSV upload route

// Route Mounts
app.use('/dashboard', dashboardRoute);
app.use('/complete-profile', profileCompletionRoute);
app.use('/create-property', createPropertyRoute);
app.use('/create-room', createUnitRoute);
app.use('/property', viewPropertyRoute);
app.use('/unit', viewUnitRoute);
app.use('/add-tenant', addTenantRoute);
app.use('/invite-tenant', inviteTenantRoute);
app.use('/tenant', tenantRoute);
app.use('/rent-payments', rentPaymentsRoutes);
app.use('/api', uploadTenantsRoute);

// Root Route
app.get('/', (req, res) => {
  res.send(
    req.oidc.isAuthenticated()
      ? `<h2>Welcome back, ${req.oidc.user.name}!</h2><a href="/dashboard">Dashboard</a> <a href="/logout">Logout</a>`
      : `<h2>You are logged out</h2><a href="/login">Owner Login</a><br><br><a href="/tenant-login">Tenant Login</a>`
  );
});

// Rent status updater
const updateRentStatusIfNeeded = require('./utils/updateRentDue');
updateRentStatusIfNeeded();
setInterval(updateRentStatusIfNeeded, 24 * 60 * 60 * 1000); // once daily

// Start server
app.listen(3000, () => {
  console.log(`Server is listening on port 3000\nhttp://localhost:3000`);
});

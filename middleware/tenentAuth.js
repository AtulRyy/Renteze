// middleware/tenantAuth.js
function tenantAuth(req, res, next) {
    if (req.session && req.session.tenant) {
      return next();
    }
    res.redirect('/tenant/login');
  }
  
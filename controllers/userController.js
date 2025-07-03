exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const Owner = require('../models/user');   // assuming owners in 'users' collection
    const Tenant = require('../models/tenant'); // tenants in separate collection

    let user = await Owner.findOne({ email });
    if (!user) user = await Tenant.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error in getUserByEmail:", err);
    res.status(500).json({ error: err.message });
  }
};

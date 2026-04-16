const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

// GET live rates from open.er-api.com (free, no key needed for basic)
router.get('/rates', protect, async (req, res) => {
  try {
    const base = req.query.base || 'USD';
    const resp = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await resp.json();
    if (data.result !== 'success') throw new Error('Rate fetch failed');
    res.json({ success: true, base, rates: data.rates, updated: data.time_last_update_utc });
  } catch (err) {
    // Fallback hardcoded rates
    res.json({
      success: true, base: 'USD', fallback: true,
      rates: { USD:1, EUR:0.92, GBP:0.79, JPY:149.5, AUD:1.53, CAD:1.36, INR:83.1, SGD:1.34, CHF:0.89, CNY:7.24, MYR:4.71, THB:35.2, AED:3.67, MXN:17.2, BRL:4.97 },
    });
  }
});
module.exports = router;

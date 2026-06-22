const express = require('express');

const router = express.Router();

// Demo data for APMC markets and today's crop prices
function getTodayDateLabel() {
  const d = new Date();
  // Format as DD-MM-YYYY (India common format)
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function getDemoMarkets() {
  const updatedAt = new Date().toISOString();
  const dateLabel = getTodayDateLabel();
  return {
    date: dateLabel,
    currency: 'INR',
    uom: 'per quintal',
    markets: [
      {
        id: 'blr-apmc',
        name: 'Bengaluru APMC',
        location: 'Bengaluru, Karnataka',
        updatedAt,
        crops: [
          { name: 'Tomato', min: 800, modal: 1200, max: 1600 },
          { name: 'Onion', min: 1000, modal: 1400, max: 1800 },
          { name: 'Potato', min: 900, modal: 1200, max: 1500 },
          { name: 'Rice (Paddy)', min: 1800, modal: 2200, max: 2500 },
          { name: 'Wheat', min: 2000, modal: 2250, max: 2500 },
          { name: 'Maize', min: 1600, modal: 1800, max: 2000 }
        ]
      },
      {
        id: 'ckm-apmc',
        name: 'Chikkamagalur APMC',
        location: 'Chikkamagaluru, Karnataka',
        updatedAt,
        crops: [
          { name: 'Arecanut', min: 38000, modal: 42000, max: 46000 },
          { name: 'Coffee (Cherry)', min: 9000, modal: 10500, max: 12000 },
          { name: 'Pepper', min: 51000, modal: 54000, max: 56000 },
          { name: 'Tomato', min: 700, modal: 1100, max: 1500 },
          { name: 'Banana', min: 900, modal: 1200, max: 1500 }
        ]
      },
      {
        id: 'kadur-apmc',
        name: 'Kadur APMC',
        location: 'Kadur, Karnataka',
        updatedAt,
        crops: [
          { name: 'Groundnut (Pod)', min: 4800, modal: 5200, max: 5600 },
          { name: 'Red Gram (Tur)', min: 7600, modal: 8000, max: 8400 },
          { name: 'Jowar', min: 2300, modal: 2500, max: 2700 },
          { name: 'Maize', min: 1500, modal: 1750, max: 1950 },
          { name: 'Cotton', min: 5400, modal: 5800, max: 6200 }
        ]
      }
    ]
  };
}

// GET /api/markets/prices
router.get('/prices', (req, res) => {
  const data = getDemoMarkets();
  res.json(data);
});

module.exports = router;

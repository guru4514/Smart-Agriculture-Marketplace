const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const cropRoutes = require('./routes/crops');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const marketsRoutes = require('./routes/markets');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/markets', marketsRoutes);

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

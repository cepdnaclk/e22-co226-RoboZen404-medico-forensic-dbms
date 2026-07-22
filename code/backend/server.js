const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const patientRoutes = require('./routes/patients');
const clinicalRoutes = require('./routes/clinical');
const autopsyRoutes = require('./routes/autopsy');
const specimenRoutes = require('./routes/specimens');
const reportRoutes = require('./routes/reports');
const staffRoutes = require('./routes/staff');
const notificationRoutes = require('./routes/notifications');
const documentRoutes = require('./routes/documents');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/cases/clinical', clinicalRoutes);
app.use('/api/cases/autopsy', autopsyRoutes);
app.use('/api/specimens', specimenRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Forensic Medical Department API' });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        process.exit(1);
    }
    console.error('Server error:', err);
});

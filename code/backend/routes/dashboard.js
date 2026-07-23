const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [activeCases] = await pool.query(
            "SELECT COUNT(*) AS count FROM Case_Table WHERE Status = 'Open'"
        );
        const [pendingReports] = await pool.query(
            "SELECT COUNT(*) AS count FROM PendingLabRequests" // Querying the SQL View
        );
        const [totalPatients] = await pool.query(
            'SELECT COUNT(*) AS count FROM Patient'
        );
        const courtDates = [{ count: 0 }];
        const [clinicalCount] = await pool.query(
            'SELECT COUNT(*) AS count FROM ClinicalCase'
        );
        const [autopsyCount] = await pool.query(
            'SELECT COUNT(*) AS count FROM AutopsyCase'
        );

        res.json({
            activeCases: activeCases[0].count,
            pendingReports: pendingReports[0].count,
            totalPatients: totalPatients[0].count,
            courtDates: courtDates[0].count,
            clinicalCases: clinicalCount[0].count,
            autopsyCases: autopsyCount[0].count
        });
    } catch (error) {
        console.error('Dashboard stats error:', error.message);
        res.status(500).json({ message: 'Failed to load dashboard stats' });
    }
});

router.get('/recent-cases', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ct.CaseID, ct.CaseDate, ct.Status,
                   'Clinical' AS CaseType, c.MLEF_No AS RefNo,
                   CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            JOIN Patient pat ON c.PatientID = pat.PatientID
            JOIN Person p ON pat.PatientID = p.PersonID
            JOIN Staff s ON c.JMO_StaffID = s.StaffID
            UNION ALL
            SELECT ct.CaseID, ct.CaseDate, ct.Status,
                   'Autopsy' AS CaseType, a.PM_No AS RefNo,
                   CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM AutopsyCase a
            JOIN Case_Table ct ON a.AutopsyCaseID = ct.CaseID
            JOIN Deceased d ON a.DeceasedID = d.DeceasedID
            JOIN Person p ON d.DeceasedID = p.PersonID
            JOIN Staff s ON a.JMO_StaffID = s.StaffID
            ORDER BY CaseDate DESC
            LIMIT 20
        `);
        res.json(rows);
    } catch (error) {
        console.error('Recent cases error:', error.message);
        res.status(500).json({ message: 'Failed to load recent cases' });
    }
});

router.get('/audit-log', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.LogID, a.Action, a.TableName, a.RecordID, a.Timestamp,
                   u.Username
            FROM AuditLog a
            JOIN UserAccount u ON a.UserID = u.UserID
            ORDER BY a.Timestamp DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load audit log' });
    }
});

// Daily case report — cases registered today
router.get('/daily-report', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ct.CaseID, ct.CaseDate, ct.Status,
                   'Clinical' AS CaseType, c.MLEF_No AS RefNo,
                   CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            JOIN Patient pat ON c.PatientID = pat.PatientID
            JOIN Person p ON pat.PatientID = p.PersonID
            JOIN Staff s ON c.JMO_StaffID = s.StaffID
            WHERE ct.CaseDate = CURDATE()
            UNION ALL
            SELECT ct.CaseID, ct.CaseDate, ct.Status,
                   'Autopsy' AS CaseType, a.PM_No AS RefNo,
                   CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM AutopsyCase a
            JOIN Case_Table ct ON a.AutopsyCaseID = ct.CaseID
            JOIN Deceased d ON a.DeceasedID = d.DeceasedID
            JOIN Person p ON d.DeceasedID = p.PersonID
            JOIN Staff s ON a.JMO_StaffID = s.StaffID
            WHERE ct.CaseDate = CURDATE()
            ORDER BY CaseDate DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Daily report error:', error.message);
        res.status(500).json({ message: 'Failed to load daily report' });
    }
});

// Monthly report — aggregate stats for current month
router.get('/monthly-report', verifyToken, async (req, res) => {
    try {
        const [byStatus] = await pool.query(`
            SELECT Status, COUNT(*) AS Total
            FROM Case_Table
            WHERE MONTH(CaseDate) = MONTH(CURDATE()) AND YEAR(CaseDate) = YEAR(CURDATE())
            GROUP BY Status
        `);
        const [byType] = await pool.query(`
            SELECT 'Clinical' AS CaseType, COUNT(*) AS Total FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            WHERE MONTH(ct.CaseDate) = MONTH(CURDATE()) AND YEAR(ct.CaseDate) = YEAR(CURDATE())
            UNION ALL
            SELECT 'Autopsy' AS CaseType, COUNT(*) AS Total FROM AutopsyCase a
            JOIN Case_Table ct ON a.AutopsyCaseID = ct.CaseID
            WHERE MONTH(ct.CaseDate) = MONTH(CURDATE()) AND YEAR(ct.CaseDate) = YEAR(CURDATE())
        `);
        const [totalThisMonth] = await pool.query(`
            SELECT COUNT(*) AS Total FROM Case_Table
            WHERE MONTH(CaseDate) = MONTH(CURDATE()) AND YEAR(CaseDate) = YEAR(CURDATE())
        `);
        const [totalPatients] = await pool.query(`SELECT COUNT(*) AS Total FROM Patient`);
        const [totalSpecimens] = await pool.query(`SELECT COUNT(*) AS Total FROM Specimen`);

        res.json({
            totalThisMonth: totalThisMonth[0].Total,
            totalPatients: totalPatients[0].Total,
            totalSpecimens: totalSpecimens[0].Total,
            byStatus,
            byType
        });
    } catch (error) {
        console.error('Monthly report error:', error.message);
        res.status(500).json({ message: 'Failed to load monthly report' });
    }
});

// Pending cases — all open cases with details
router.get('/pending-cases', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ct.CaseID, ct.CaseDate, ct.Status,
                   'Clinical' AS CaseType, c.MLEF_No AS RefNo,
                   CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            JOIN Patient pat ON c.PatientID = pat.PatientID
            JOIN Person p ON pat.PatientID = p.PersonID
            JOIN Staff s ON c.JMO_StaffID = s.StaffID
            WHERE ct.Status = 'Open'
            UNION ALL
            SELECT ct.CaseID, ct.CaseDate, ct.Status,
                   'Autopsy' AS CaseType, a.PM_No AS RefNo,
                   CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM AutopsyCase a
            JOIN Case_Table ct ON a.AutopsyCaseID = ct.CaseID
            JOIN Deceased d ON a.DeceasedID = d.DeceasedID
            JOIN Person p ON d.DeceasedID = p.PersonID
            JOIN Staff s ON a.JMO_StaffID = s.StaffID
            WHERE ct.Status = 'Open'
            ORDER BY CaseDate DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Pending cases error:', error.message);
        res.status(500).json({ message: 'Failed to load pending cases' });
    }
});

// Statistical overview
router.get('/statistics', verifyToken, async (req, res) => {
    try {
        const [casesByMonth] = await pool.query(`
            SELECT DATE_FORMAT(CaseDate, '%Y-%m') AS Month, COUNT(*) AS Total
            FROM Case_Table
            GROUP BY DATE_FORMAT(CaseDate, '%Y-%m')
            ORDER BY Month DESC
            LIMIT 12
        `);
        const [injuryTypes] = await pool.query(`
            SELECT Type, COUNT(*) AS Total FROM Injury GROUP BY Type ORDER BY Total DESC
        `);
        const [labStatus] = await pool.query(`
            SELECT Status, COUNT(*) AS Total FROM LabRequest GROUP BY Status
        `);
        const [caseStatus] = await pool.query(`
            SELECT Status, COUNT(*) AS Total FROM Case_Table GROUP BY Status
        `);
        res.json({ casesByMonth, injuryTypes, labStatus, caseStatus });
    } catch (error) {
        console.error('Statistics error:', error.message);
        res.status(500).json({ message: 'Failed to load statistics' });
    }
});

module.exports = router;

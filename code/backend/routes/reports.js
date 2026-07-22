const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

// List court reports
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cr.ReportID, cr.ReportType, cr.IssueDate, cr.FilePath,
                   ct.CaseID, ct.Status AS CaseStatus,
                   CONCAT(s.FirstName, ' ', s.LastName) AS SignedBy,
                   COALESCE(cc.MLEF_No, ac.PM_No) AS CaseNo
            FROM CourtReport cr
            JOIN Case_Table ct ON cr.CaseID = ct.CaseID
            JOIN Staff s ON cr.SignedByStaffID = s.StaffID
            LEFT JOIN ClinicalCase cc ON ct.CaseID = cc.ClinicalCaseID
            LEFT JOIN AutopsyCase ac ON ct.CaseID = ac.AutopsyCaseID
            ORDER BY cr.IssueDate DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load reports' });
    }
});

// Create court report
router.post('/', verifyToken, async (req, res) => {
    const { caseId, reportType, signedByStaffId } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO CourtReport (CaseID, ReportType, IssueDate, SignedByStaffID) VALUES (?, ?, CURDATE(), ?)',
            [caseId, reportType, signedByStaffId]
        );
        res.status(201).json({ message: 'Report created', reportId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create report' });
    }
});

// List court summons
router.get('/summons', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT cs.SummonsID, cs.CaseNo, cs.RequiredDate, cs.Status,
                   CONCAT(s.FirstName, ' ', s.LastName) AS StaffName,
                   ea.Name AS CourtName
            FROM CourtSummons cs
            JOIN Staff s ON cs.StaffID = s.StaffID
            JOIN ExternalAuthority ea ON cs.AuthorityID = ea.AuthID
            ORDER BY cs.RequiredDate DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load summons' });
    }
});

// Create court summons
router.post('/summons', verifyToken, async (req, res) => {
    const { staffId, authorityId, caseNo, requiredDate } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO CourtSummons (StaffID, AuthorityID, CaseNo, RequiredDate, Status) VALUES (?, ?, ?, ?, 'Pending')",
            [staffId, authorityId, caseNo, requiredDate]
        );
        
        // Find UserID for the StaffID to send notification
        const [users] = await pool.query('SELECT UserID FROM User WHERE StaffID = ?', [staffId]);
        if (users.length > 0) {
            await pool.query(
                'INSERT INTO Notification (UserID, Message) VALUES (?, ?)',
                [users[0].UserID, `URGENT: You have been summoned to court for Case ${caseNo} on ${requiredDate}`]
            );
        }

        res.status(201).json({ message: 'Summons created', summonsId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create summons' });
    }
});

// Update court summons status
router.put('/summons/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query(
            "UPDATE CourtSummons SET Status = ? WHERE SummonsID = ?",
            [status, req.params.id]
        );
        res.json({ message: 'Summons status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
});

module.exports = router;

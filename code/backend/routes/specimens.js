const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

// List specimens for a case
router.get('/case/:caseId', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, lr.RequestID, lr.Status AS LabStatus, lr.RequestDate,
                   lres.ResultDetails, lres.ReceivedDate,
                   ea.Name AS LabName
            FROM Specimen s
            LEFT JOIN LabRequest lr ON s.SpecimenID = lr.SpecimenID
            LEFT JOIN LabResult lres ON lr.RequestID = lres.RequestID
            LEFT JOIN ExternalAuthority ea ON lr.TargetLabID = ea.AuthID
            WHERE s.CaseID = ?
        `, [req.params.caseId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load specimens' });
    }
});

// List all specimens
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, ct.CaseDate, ct.Status AS CaseStatus,
                   lr.Status AS LabStatus, ea.Name AS LabName,
                   COALESCE(ac.PM_No, cc.MLEF_No) AS CaseReference
            FROM Specimen s
            JOIN Case_Table ct ON s.CaseID = ct.CaseID
            LEFT JOIN AutopsyCase ac ON ct.CaseID = ac.AutopsyCaseID
            LEFT JOIN ClinicalCase cc ON ct.CaseID = cc.ClinicalCaseID
            LEFT JOIN LabRequest lr ON s.SpecimenID = lr.SpecimenID
            LEFT JOIN ExternalAuthority ea ON lr.TargetLabID = ea.AuthID
            ORDER BY s.CollectedDate DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Specimen query error:', error);
        res.status(500).json({ message: 'Failed to load specimens' });
    }
});

// Create specimen and optional lab request
router.post('/', verifyToken, async (req, res) => {
    const { caseId, specimenType, collectedDate, storageLocation, targetLabId, analysisRequired } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [specimenResult] = await conn.query(
            'INSERT INTO Specimen (CaseID, SpecimenType, CollectedDate, StorageLocation) VALUES (?, ?, ?, ?)',
            [caseId, specimenType, collectedDate, storageLocation]
        );
        const specimenId = specimenResult.insertId;

        if (targetLabId && analysisRequired) {
            await conn.query(
                "INSERT INTO LabRequest (SpecimenID, TargetLabID, AnalysisRequired, RequestDate, Status) VALUES (?, ?, ?, CURDATE(), 'Pending')",
                [specimenId, targetLabId, analysisRequired]
            );
        }

        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, `Created specimen ${specimenType}`, 'Specimen', specimenId]
        );

        await conn.commit();
        res.status(201).json({ message: 'Specimen and Lab Request recorded successfully', specimenId });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Failed to record specimen' });
    } finally {
        conn.release();
    }
});

// Create lab request
router.post('/lab-request', verifyToken, async (req, res) => {
    const { specimenId, targetLabId, analysisRequired } = req.body;
    try {
        const [result] = await pool.query(
            "INSERT INTO LabRequest (SpecimenID, TargetLabID, AnalysisRequired, RequestDate, Status) VALUES (?, ?, ?, CURDATE(), 'Pending')",
            [specimenId, targetLabId, analysisRequired]
        );
        res.status(201).json({ message: 'Lab request created', requestId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create lab request' });
    }
});

// Add lab result
router.post('/lab-result', verifyToken, async (req, res) => {
    const { requestId, resultDetails } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            'INSERT INTO LabResult (RequestID, ResultDetails, ReceivedDate) VALUES (?, ?, CURDATE())',
            [requestId, resultDetails]
        );
        await conn.query("UPDATE LabRequest SET Status = 'Completed' WHERE RequestID = ?", [requestId]);
        await conn.commit();
        res.status(201).json({ message: 'Lab result recorded' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Failed to record lab result' });
    } finally {
        conn.release();
    }
});

module.exports = router;

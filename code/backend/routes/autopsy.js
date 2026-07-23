const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

// List all autopsy cases
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.AutopsyCaseID, a.PM_No, a.PlaceOfDeath, a.AutopsyDate,
                   ct.CaseDate, ct.Status,
                   CONCAT(p.FirstName, ' ', p.LastName) AS DeceasedName, p.NIC,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName,
                   d.DateOfDeath, d.TimeOfDeath
            FROM AutopsyCase a
            JOIN Case_Table ct ON a.AutopsyCaseID = ct.CaseID
            JOIN Deceased d ON a.DeceasedID = d.DeceasedID
            JOIN Person p ON d.DeceasedID = p.PersonID
            JOIN Staff s ON a.JMO_StaffID = s.StaffID
            ORDER BY ct.CaseDate DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('List autopsy cases error:', error.message);
        res.status(500).json({ message: 'Failed to load autopsy cases' });
    }
});

// Get single autopsy case with full details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [caseData] = await pool.query(`
            SELECT a.*, ct.CaseDate, ct.Status,
                   CONCAT(p.FirstName, ' ', p.LastName) AS DeceasedName, p.NIC, p.DOB, p.Gender,
                   d.DateOfDeath, d.TimeOfDeath,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM AutopsyCase a
            JOIN Case_Table ct ON a.AutopsyCaseID = ct.CaseID
            JOIN Deceased d ON a.DeceasedID = d.DeceasedID
            JOIN Person p ON d.DeceasedID = p.PersonID
            JOIN Staff s ON a.JMO_StaffID = s.StaffID
            WHERE a.AutopsyCaseID = ?
        `, [req.params.id]);

        if (caseData.length === 0) return res.status(404).json({ message: 'Case not found' });

        const [injuries] = await pool.query('SELECT * FROM Injury WHERE CaseID = ?', [req.params.id]);
        const [internalExam] = await pool.query('SELECT * FROM InternalExamination WHERE AutopsyCaseID = ?', [req.params.id]);
        const [causeOfDeath] = await pool.query('SELECT * FROM CauseOfDeath WHERE AutopsyCaseID = ?', [req.params.id]);
        const [inquest] = await pool.query(`
            SELECT i.*, e.Name AS AuthorityName, e.Type AS AuthorityType
            FROM InquestOrder i
            LEFT JOIN ExternalAuthority e ON i.AuthorityID = e.AuthID
            WHERE i.AutopsyCaseID = ?
        `, [req.params.id]);
        const [specimens] = await pool.query(`
            SELECT s.*, lr.RequestID, lr.Status AS LabStatus, lr.RequestDate,
                   lres.ResultDetails, lres.ReceivedDate,
                   ea.Name AS LabName
            FROM Specimen s
            LEFT JOIN LabRequest lr ON s.SpecimenID = lr.SpecimenID
            LEFT JOIN LabResult lres ON lr.RequestID = lres.RequestID
            LEFT JOIN ExternalAuthority ea ON lr.TargetLabID = ea.AuthID
            WHERE s.CaseID = ?
        `, [req.params.id]);

        res.json({
            ...caseData[0],
            injuries,
            internalExamination: internalExam[0] || null,
            causeOfDeath: causeOfDeath[0] || null,
            inquestOrder: inquest[0] || null,
            specimens
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load autopsy case' });
    }
});

// Create autopsy case
router.post('/', verifyToken, async (req, res) => {
    const { firstName, lastName, dob, gender, nic, dateOfDeath, timeOfDeath,
            jmoStaffId, pmNo, placeOfDeath, autopsyDate, injuries, internalExam, causeOfDeath, inquestOrder } = req.body;
    const conn = await pool.getConnection();
    const toMySQLDate = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return null;
        return dt.toISOString().slice(0, 19).replace('T', ' ');
    };
    try {
        await conn.beginTransaction();

        // Create Person
        const [personResult] = await conn.query(
            'INSERT INTO Person (FirstName, LastName, DOB, Gender, NIC) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, toMySQLDate(dob), gender, nic || null]
        );
        // Create Deceased
        await conn.query(
            'INSERT INTO Deceased (DeceasedID, DateOfDeath, TimeOfDeath) VALUES (?, ?, ?)',
            [personResult.insertId, toMySQLDate(dateOfDeath), timeOfDeath || null]
        );
        // Create Case_Table entry
        const [caseResult] = await conn.query(
            "INSERT INTO Case_Table (CaseDate, Status) VALUES (CURDATE(), 'Open')"
        );
        const caseId = caseResult.insertId;

        // Create AutopsyCase
        await conn.query(
            'INSERT INTO AutopsyCase (AutopsyCaseID, DeceasedID, JMO_StaffID, PM_No, PlaceOfDeath, AutopsyDate) VALUES (?, ?, ?, ?, ?, ?)',
            [caseId, personResult.insertId, jmoStaffId, pmNo, placeOfDeath || null, toMySQLDate(autopsyDate)]
        );

        if (injuries && injuries.length > 0) {
            for (const inj of injuries) {
                await conn.query(
                    'INSERT INTO Injury (CaseID, Type, Dimensions, Location, Description) VALUES (?, ?, ?, ?, ?)',
                    [caseId, inj.type, inj.dimensions, inj.location, inj.description]
                );
            }
        }

        if (internalExam) {
            await conn.query(
                'INSERT INTO InternalExamination (AutopsyCaseID, ExaminationData) VALUES (?, ?)',
                [caseId, JSON.stringify(internalExam)]
            );
        }

        if (causeOfDeath) {
            await conn.query(
                'INSERT INTO CauseOfDeath (AutopsyCaseID, ImmediateCause, AntecedentCause, UnderlyingCause, ContributoryCause, MaternalDeath, Comments) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [caseId, causeOfDeath.immediate, causeOfDeath.antecedent, causeOfDeath.underlying, causeOfDeath.contributory, causeOfDeath.maternalDeath || 'None', causeOfDeath.comments || null]
            );
        }

        if (inquestOrder && inquestOrder.authorityId) {
            await conn.query(
                'INSERT INTO InquestOrder (AutopsyCaseID, AuthorityID, CaseNumber, DateOfIssue) VALUES (?, ?, ?, CURDATE())',
                [caseId, inquestOrder.authorityId, inquestOrder.caseNumber || null]
            );
        }

        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, 'Created autopsy case ' + pmNo, 'AutopsyCase', caseId]
        );

        if (jmoStaffId) {
            const [staffRes] = await conn.query('SELECT UserID FROM Staff WHERE StaffID = ?', [jmoStaffId]);
            if (staffRes.length > 0 && staffRes[0].UserID) {
                await conn.query(
                    'INSERT INTO Notification (UserID, Message) VALUES (?, ?)',
                    [staffRes[0].UserID, `You have been assigned Autopsy Case PM No: ${pmNo}`]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Autopsy case created', caseId });
    } catch (error) {
        await conn.rollback();
        console.error('Create autopsy error:', error.message);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
});

// Update case status
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        await pool.query('UPDATE Case_Table SET Status = ? WHERE CaseID = ?', [req.body.status, req.params.id]);
        
        await pool.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, `Updated status to ${req.body.status}`, 'Case_Table', req.params.id]
        );
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
});

// Update case findings (JMO only)
router.put('/:id/findings', verifyToken, async (req, res) => {
    const { internalExam, causeOfDeath, identifiedBy } = req.body;
    const caseId = req.params.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Update Identified By
        if (identifiedBy !== undefined) {
            await conn.query(
                'UPDATE AutopsyCase SET IdentifiedBy = ? WHERE AutopsyCaseID = ?',
                [identifiedBy, caseId]
            );
        }

        // Update Internal Examination
        if (internalExam) {
            await conn.query(
                `INSERT INTO InternalExamination (AutopsyCaseID, ExaminationData) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 ExaminationData = VALUES(ExaminationData)`,
                [caseId, JSON.stringify(internalExam)]
            );
        }

        // Update Cause of Death
        if (causeOfDeath) {
            await conn.query(
                `INSERT INTO CauseOfDeath (AutopsyCaseID, ImmediateCause, AntecedentCause, UnderlyingCause, ContributoryCause, MaternalDeath, Comments) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 ImmediateCause = VALUES(ImmediateCause), AntecedentCause = VALUES(AntecedentCause), UnderlyingCause = VALUES(UnderlyingCause), ContributoryCause = VALUES(ContributoryCause), MaternalDeath = VALUES(MaternalDeath), Comments = VALUES(Comments)`,
                [caseId, causeOfDeath.immediate, causeOfDeath.antecedent, causeOfDeath.underlying, causeOfDeath.contributory, causeOfDeath.maternalDeath || 'None', causeOfDeath.comments || null]
            );
        }

        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, `Updated findings for case`, 'AutopsyCase', caseId]
        );

        await conn.commit();
        res.json({ message: 'Findings updated successfully' });
    } catch (error) {
        await conn.rollback();
        console.error('Update findings error:', error.message);
        res.status(500).json({ message: 'Failed to update findings' });
    } finally {
        conn.release();
    }
});

module.exports = router;

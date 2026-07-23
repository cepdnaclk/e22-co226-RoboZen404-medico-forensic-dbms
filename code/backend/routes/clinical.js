const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

// List all clinical cases with patient and JMO info
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.ClinicalCaseID, c.MLEF_No, c.AdmissionDate,
                   ct.CaseDate, ct.Status,
                   CONCAT(p.FirstName, ' ', p.LastName) AS PatientName, p.NIC,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName,
                   ea.Name AS PoliceStationName
            FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            JOIN Patient pat ON c.PatientID = pat.PatientID
            JOIN Person p ON pat.PatientID = p.PersonID
            JOIN Staff s ON c.JMO_StaffID = s.StaffID
            LEFT JOIN ExternalAuthority ea ON c.PoliceStationID = ea.AuthID
            ORDER BY ct.CaseDate DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('List clinical cases error:', error.message);
        res.status(500).json({ message: 'Failed to load clinical cases' });
    }
});

// Get single clinical case with all related data
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [caseData] = await pool.query(`
            SELECT c.*, ct.CaseDate, ct.Status,
                   CONCAT(p.FirstName, ' ', p.LastName) AS PatientName, p.NIC, p.DOB, p.Gender,
                   pat.Address, pat.EmergencyContact,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName, s.Designation,
                   ea.Name AS PoliceStationName
            FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            JOIN Patient pat ON c.PatientID = pat.PatientID
            JOIN Person p ON pat.PatientID = p.PersonID
            JOIN Staff s ON c.JMO_StaffID = s.StaffID
            LEFT JOIN ExternalAuthority ea ON c.PoliceStationID = ea.AuthID
            WHERE c.ClinicalCaseID = ?
        `, [req.params.id]);

        if (caseData.length === 0) return res.status(404).json({ message: 'Case not found' });

        const [injuries] = await pool.query(
            'SELECT * FROM Injury WHERE CaseID = ?', [req.params.id]
        );
        const [intox] = await pool.query(
            'SELECT * FROM IntoxicationRecord WHERE CaseID = ?', [req.params.id]
        );
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
        const [weapons] = await pool.query(`
            SELECT cw.*, w.Type AS WeaponType, w.Description AS WeaponDesc
            FROM CaseWeapon cw JOIN Weapon w ON cw.WeaponID = w.WeaponID
            WHERE cw.CaseID = ?
        `, [req.params.id]);

        const [partB] = await pool.query(
            'SELECT * FROM MLEF_PartB_Details WHERE ClinicalCaseID = ?', [req.params.id]
        );
        const [sexualAssault] = await pool.query(
            'SELECT * FROM SexualAssaultExam WHERE ClinicalCaseID = ?', [req.params.id]
        );

        res.json({
            ...caseData[0],
            injuries,
            intoxicationRecords: intox,
            specimens,
            weapons,
            partB: partB[0] || null,
            sexualAssault: sexualAssault[0] || null
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load case details' });
    }
});

// Create clinical case with transaction
router.post('/', verifyToken, async (req, res) => {
    const { patientId, jmoStaffId, policeStationId, mlefNo, admissionDate, dateOfIssue, reasonForExamination, policeOfficerName, policeOfficerRank, policeOfficerRegNo, injuries, intoxication } = req.body;
    const conn = await pool.getConnection();
    const toMySQLDate = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return null;
        return dt.toISOString().slice(0, 19).replace('T', ' ');
    };
    try {
        await conn.beginTransaction();

        const [caseResult] = await conn.query(
            "INSERT INTO Case_Table (CaseDate, Status) VALUES (CURDATE(), 'Open')"
        );
        const caseId = caseResult.insertId;

        await conn.query(
            'INSERT INTO ClinicalCase (ClinicalCaseID, PatientID, JMO_StaffID, PoliceStationID, MLEF_No, AdmissionDate, DateOfIssue, ReasonForExamination, PoliceOfficerName, PoliceOfficerRank, PoliceOfficerRegNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [caseId, patientId, jmoStaffId, policeStationId || null, mlefNo, toMySQLDate(admissionDate), toMySQLDate(dateOfIssue), reasonForExamination || null, policeOfficerName || null, policeOfficerRank || null, policeOfficerRegNo || null]
        );

        if (injuries && injuries.length > 0) {
            for (const inj of injuries) {
                await conn.query(
                    'INSERT INTO Injury (CaseID, Type, Dimensions, Location, Description) VALUES (?, ?, ?, ?, ?)',
                    [caseId, inj.type, inj.dimensions, inj.location, inj.description]
                );
            }
        }

        if (intoxication) {
            await conn.query(
                'INSERT INTO IntoxicationRecord (CaseID, SubstanceType, Consumed, UnderInfluence) VALUES (?, ?, ?, ?)',
                [caseId, intoxication.substanceType, intoxication.consumed || false, intoxication.underInfluence || false]
            );
        }

        if (jmoStaffId) {
            await conn.query(`
                INSERT INTO Notification (UserID, Message)
                SELECT u.UserID, ?
                FROM UserAccount u
                JOIN Staff s ON u.UserID = s.UserID
                WHERE s.StaffID = ?
            `, [`You have been assigned to Clinical Case MLEF No: ${mlefNo}`, jmoStaffId]);
        }

        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, 'Created clinical case ' + mlefNo, 'ClinicalCase', caseId]
        );

        await conn.commit();
        res.status(201).json({ message: 'Clinical case created', caseId });
    } catch (error) {
        await conn.rollback();
        console.error('Create clinical case error:', error.message);
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

// Update case findings (Doctor only)
router.put('/:id/findings', verifyToken, async (req, res) => {
    const { injuries, intoxication, partB, sexualAssault } = req.body;
    const caseId = req.params.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Update Injuries (delete and recreate to handle array updates simply)
        if (injuries !== undefined) {
            await conn.query('DELETE FROM Injury WHERE CaseID = ?', [caseId]);
            if (injuries.length > 0) {
                for (const inj of injuries) {
                    await conn.query(
                        'INSERT INTO Injury (CaseID, Type, Dimensions, Location, Description) VALUES (?, ?, ?, ?, ?)',
                        [caseId, inj.type || inj.Type, inj.dimensions || inj.Dimensions, inj.location || inj.Location, inj.description || inj.Description]
                    );
                }
            }
        }

        // Update Intoxication
        if (intoxication) {
            // Check if exists first since it's not UNIQUE in schema (just a FK)
            const [existing] = await conn.query('SELECT RecordID FROM IntoxicationRecord WHERE CaseID = ?', [caseId]);
            if (existing.length > 0) {
                await conn.query(
                    'UPDATE IntoxicationRecord SET SubstanceType=?, Consumed=?, UnderInfluence=? WHERE CaseID=?',
                    [intoxication.substanceType, intoxication.consumed, intoxication.underInfluence, caseId]
                );
            } else {
                await conn.query(
                    'INSERT INTO IntoxicationRecord (CaseID, SubstanceType, Consumed, UnderInfluence) VALUES (?, ?, ?, ?)',
                    [caseId, intoxication.substanceType, intoxication.consumed, intoxication.underInfluence]
                );
            }
        }

        // Update MLEF Part B Details
        if (partB) {
            const toMySQLDate = (d) => {
                if (!d) return null;
                // Handle ISO strings with Z suffix that MySQL can't parse
                const dt = new Date(d);
                if (isNaN(dt.getTime())) return null;
                return dt.toISOString().slice(0, 19).replace('T', ' ');
            };
            const examDate = toMySQLDate(partB.examinationDate);
            const disDate = toMySQLDate(partB.dischargeDate);
            const [existingPartB] = await conn.query('SELECT DetailID FROM MLEF_PartB_Details WHERE ClinicalCaseID = ?', [caseId]);
            if (existingPartB.length > 0) {
                await conn.query(
                    'UPDATE MLEF_PartB_Details SET ProducedBy=?, ExaminationDate=?, ExaminationPlace=?, DischargeDate=?, CausativeWeapon=?, CategoryOfHurt=?, EndangersLife=?, Investigations=?, Referrals=?, Recommendations=?, Remarks=? WHERE ClinicalCaseID=?',
                    [partB.producedBy, examDate, partB.examinationPlace, disDate, partB.causativeWeapon, partB.categoryOfHurt, partB.endangersLife ? 1 : 0, partB.investigations, partB.referrals, partB.recommendations, partB.remarks, caseId]
                );
            } else {
                await conn.query(
                    'INSERT INTO MLEF_PartB_Details (ClinicalCaseID, ProducedBy, ExaminationDate, ExaminationPlace, DischargeDate, CausativeWeapon, CategoryOfHurt, EndangersLife, Investigations, Referrals, Recommendations, Remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [caseId, partB.producedBy, examDate, partB.examinationPlace, disDate, partB.causativeWeapon, partB.categoryOfHurt, partB.endangersLife ? 1 : 0, partB.investigations, partB.referrals, partB.recommendations, partB.remarks]
                );
            }
        }

        // Update Sexual Assault Exam
        if (sexualAssault) {
            const [existingSA] = await conn.query('SELECT ExamID FROM SexualAssaultExam WHERE ClinicalCaseID = ?', [caseId]);
            if (existingSA.length > 0) {
                await conn.query(
                    'UPDATE SexualAssaultExam SET HymenStatus=?, PenetrationSigns=?, OtherSigns=? WHERE ClinicalCaseID=?',
                    [sexualAssault.hymenStatus, sexualAssault.penetrationSigns, sexualAssault.otherSigns, caseId]
                );
            } else {
                await conn.query(
                    'INSERT INTO SexualAssaultExam (ClinicalCaseID, HymenStatus, PenetrationSigns, OtherSigns) VALUES (?, ?, ?, ?)',
                    [caseId, sexualAssault.hymenStatus, sexualAssault.penetrationSigns, sexualAssault.otherSigns]
                );
            }
        }

        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, `Updated findings for clinical case`, 'ClinicalCase', caseId]
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

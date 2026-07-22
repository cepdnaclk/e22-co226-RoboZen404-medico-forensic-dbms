const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

// List all patients with Person data
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.PersonID, p.FirstName, p.LastName, p.DOB, p.Gender, p.NIC,
                   pat.Address, pat.EmergencyContact
            FROM Patient pat
            JOIN Person p ON pat.PatientID = p.PersonID
            ORDER BY p.FirstName
        `);
        res.json(rows);
    } catch (error) {
        console.error('List patients error:', error.message);
        res.status(500).json({ message: 'Failed to load patients' });
    }
});

// Get single patient with case history
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [patient] = await pool.query(`
            SELECT p.PersonID, p.FirstName, p.LastName, p.DOB, p.Gender, p.NIC,
                   pat.Address, pat.EmergencyContact
            FROM Patient pat
            JOIN Person p ON pat.PatientID = p.PersonID
            WHERE p.PersonID = ?
        `, [req.params.id]);

        if (patient.length === 0) return res.status(404).json({ message: 'Patient not found' });

        const [cases] = await pool.query(`
            SELECT ct.CaseID, ct.CaseDate, ct.Status, c.MLEF_No, c.AdmissionDate,
                   CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
            FROM ClinicalCase c
            JOIN Case_Table ct ON c.ClinicalCaseID = ct.CaseID
            JOIN Staff s ON c.JMO_StaffID = s.StaffID
            WHERE c.PatientID = ?
            ORDER BY ct.CaseDate DESC
        `, [req.params.id]);

        res.json({ ...patient[0], cases });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load patient' });
    }
});

// Create new patient (Person + Patient in transaction)
router.post('/', verifyToken, async (req, res) => {
    const { firstName, lastName, dob, gender, nic, address, emergencyContact } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Calling the Stored Procedure for atomic patient registration
        const [result] = await conn.query(
            'CALL RegisterNewPatient(?, ?, ?, ?, ?, ?, ?)',
            [firstName, lastName, dob || null, gender, nic || null, address || null, emergencyContact || null]
        );

        // Fetch the newly inserted ID since CALL doesn't return insertId cleanly in all drivers
        const [[{PersonID}]] = await conn.query('SELECT PersonID FROM Person WHERE NIC = ?', [nic]);

        // Audit log
        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, 'Created new patient', 'Patient', PersonID]
        );

        await conn.commit();
        res.status(201).json({ message: 'Patient registered', patientId: PersonID });
    } catch (error) {
        await conn.rollback();
        console.error('Create patient error:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A patient with this NIC already exists' });
        }
        res.status(500).json({ message: 'Failed to register patient' });
    } finally {
        conn.release();
    }
});

// Update patient
router.put('/:id', verifyToken, async (req, res) => {
    const { firstName, lastName, dob, gender, nic, address, emergencyContact } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query(
            'UPDATE Person SET FirstName=?, LastName=?, DOB=?, Gender=?, NIC=? WHERE PersonID=?',
            [firstName, lastName, dob, gender, nic, req.params.id]
        );
        await conn.query(
            'UPDATE Patient SET Address=?, EmergencyContact=? WHERE PatientID=?',
            [address, emergencyContact, req.params.id]
        );
        await conn.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, 'Updated patient record', 'Patient', req.params.id]
        );
        await conn.commit();
        res.json({ message: 'Patient updated' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Failed to update patient' });
    } finally {
        conn.release();
    }
});

// Delete patient
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM Person WHERE PersonID = ?', [req.params.id]);
        res.json({ message: 'Patient deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete patient' });
    }
});

module.exports = router;

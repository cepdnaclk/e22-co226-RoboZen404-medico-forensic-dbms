const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');
const bcrypt = require('bcrypt');

// List all staff
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.StaffID, s.FirstName, s.LastName, s.Designation,
                   d.DeptName, r.RoleName, u.Username
            FROM Staff s
            JOIN Department d ON s.DeptID = d.DeptID
            JOIN UserAccount u ON s.UserID = u.UserID
            JOIN Role r ON u.RoleID = r.RoleID
            ORDER BY s.FirstName
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load staff' });
    }
});

// Get wards
router.get('/wards', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Ward ORDER BY Name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load wards' });
    }
});

// Get external authorities
router.get('/authorities', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ExternalAuthority ORDER BY Name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load authorities' });
    }
});


// Add new staff member (Admin only)
router.post('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { firstName, lastName, designation, username, password, roleId, deptId } = req.body;
    
    if (!firstName || !lastName || !username || !password || !roleId || !deptId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if username exists
        const [existing] = await connection.query('SELECT UserID FROM UserAccount WHERE Username = ?', [username]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert UserAccount
        const [userResult] = await connection.query(
            'INSERT INTO UserAccount (RoleID, Username, PasswordHash, IsActive) VALUES (?, ?, ?, TRUE)',
            [roleId, username, passwordHash]
        );
        const userId = userResult.insertId;

        // Insert Staff
        const [staffResult] = await connection.query(
            'INSERT INTO Staff (UserID, DeptID, FirstName, LastName, Designation) VALUES (?, ?, ?, ?, ?)',
            [userId, deptId, firstName, lastName, designation || null]
        );

        await connection.commit();
        res.status(201).json({ message: 'Staff created successfully', staffId: staffResult.insertId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error creating staff:', error);
        res.status(500).json({ message: 'Failed to create staff member' });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;

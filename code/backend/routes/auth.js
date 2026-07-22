const express = require('express');
const router = express.Router();
const pool = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query(
            'SELECT u.*, r.RoleName FROM UserAccount u JOIN Role r ON u.RoleID = r.RoleID WHERE u.Username = ?',
            [username]
        );
        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        const valid = await bcrypt.compare(password, user.PasswordHash).catch(() => false);
        if (!valid && password !== user.PasswordHash) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const [staffRows] = await pool.query(
            'SELECT StaffID, FirstName, LastName, Designation FROM Staff WHERE UserID = ?',
            [user.UserID]
        );

        const token = jwt.sign(
            { id: user.UserID, role: user.RoleName, staffId: staffRows[0]?.StaffID },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            token,
            user: {
                id: user.UserID,
                username: user.Username,
                role: user.RoleName,
                staffId: staffRows[0]?.StaffID,
                name: staffRows[0] ? `${staffRows[0].FirstName} ${staffRows[0].LastName}` : user.Username,
                designation: staffRows[0]?.Designation || user.RoleName
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Database connection failed. Is MySQL running?' });
    }
});

router.post('/register', async (req, res) => {
    const { username, password, roleId, firstName, lastName, designation, deptId } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO UserAccount (RoleID, Username, PasswordHash) VALUES (?, ?, ?)',
            [roleId || 2, username, hash]
        );
        if (firstName) {
            await pool.query(
                'INSERT INTO Staff (UserID, DeptID, FirstName, LastName, Designation) VALUES (?, ?, ?, ?, ?)',
                [result.insertId, deptId || 1, firstName, lastName, designation || 'Staff']
            );
        }
        res.status(201).json({ message: 'User registered', userId: result.insertId });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

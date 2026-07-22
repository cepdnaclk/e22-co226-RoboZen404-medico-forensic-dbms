const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

// Get unread notifications
router.get('/unread', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM Notification WHERE UserID = ? AND IsRead = FALSE ORDER BY CreatedAt DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE Notification SET IsRead = TRUE WHERE NotificationID = ? AND UserID = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notification as read' });
    }
});

module.exports = router;

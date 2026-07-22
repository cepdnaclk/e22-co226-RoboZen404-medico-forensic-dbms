const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM Case_Table WHERE CaseID = ?', [req.params.id]);
        res.json({ message: 'Case deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete case' });
    }
});

module.exports = router;

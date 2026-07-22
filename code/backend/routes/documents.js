const express = require('express');
const router = express.Router();
const pool = require('../database');
const verifyToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.get('/:caseId', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM CaseDocument WHERE CaseID = ? ORDER BY UploadedAt DESC',
            [req.params.caseId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Fetch documents error:', error);
        res.status(500).json({ message: 'Failed to load documents' });
    }
});

router.post('/:caseId', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { documentType } = req.body;
        const caseId = req.params.caseId;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        if (!documentType) {
            return res.status(400).json({ message: 'Document type is required' });
        }

        const filePath = `/uploads/${req.file.filename}`;
        const fileName = req.file.originalname;

        const [result] = await pool.query(
            'INSERT INTO CaseDocument (CaseID, DocumentType, FileName, FilePath, UploadedAt) VALUES (?, ?, ?, ?, NOW())',
            [caseId, documentType, fileName, filePath]
        );

        await pool.query(
            'INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES (?, ?, ?, ?)',
            [req.user.id, `Uploaded ${documentType} to Case ${caseId}`, 'CaseDocument', result.insertId]
        );

        res.status(201).json({
            message: 'Document uploaded successfully',
            document: {
                DocumentID: result.insertId,
                CaseID: caseId,
                DocumentType: documentType,
                FileName: fileName,
                FilePath: filePath,
                UploadedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ message: 'Failed to upload document' });
    }
});

module.exports = router;

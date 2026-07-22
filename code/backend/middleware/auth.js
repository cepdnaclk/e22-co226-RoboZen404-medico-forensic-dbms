const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ message: 'Access denied. No token provided.' });

    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. Malformed token.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

module.exports = verifyToken;

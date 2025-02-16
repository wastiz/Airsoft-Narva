const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            req.isAuthenticated = false;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.isAuthenticated = true;
        next();
    } catch (error) {
        req.isAuthenticated = false;
        next();
    }
};

module.exports = auth; 
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Token not provided"
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions"
            });
        }

        next();
    };
};
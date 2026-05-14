import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router();

router.get('/public', (req, res) => {
    res.json({
        message: "This is a public endpoint"
    });
});

router.get('/protected', authenticate, (req, res) => {
    res.json({
        message: "This is a protected endpoint",
        user: req.user
    });
});

router.get('/admin-only', authenticate, authorize(['ADMIN']), (req, res) => {
    res.json({
        message: "This is an admin-only endpoint",
        user: req.user
    });
});

export default router;
import { Router } from 'express';
import { createUser, getUsers } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN']), createUser);
router.get('/', authenticate, authorize(['ADMIN']), getUsers);

export default router;
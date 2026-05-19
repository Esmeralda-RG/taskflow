import { Router } from 'express';
import { createUser, getUsers, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN']), createUser);
router.get('/', authenticate, authorize(['ADMIN']), getUsers);

router.patch('/:id', authenticate, authorize(['ADMIN']), updateUser);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteUser);

export default router;
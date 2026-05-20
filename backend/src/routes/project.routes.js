import { Router } from 'express';
import { createProject, getProjects } from '../controllers/project.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'LEADER']), createProject);
router.get('/', authenticate, authorize(['ADMIN', 'LEADER']), getProjects);

export default router;
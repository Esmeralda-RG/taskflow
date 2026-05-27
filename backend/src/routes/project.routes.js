import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject } from '../controllers/project.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'LEADER']), createProject);
router.get('/', authenticate, authorize(['ADMIN', 'LEADER']), getProjects);
router.patch('/:id', authenticate, authorize(['ADMIN', 'LEADER']), updateProject);
router.delete('/:id', authenticate, authorize(['ADMIN', 'LEADER']), deleteProject);

export default router;
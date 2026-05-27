import { Router } from 'express';
import { addMemberToProject, getProjectMembers, removeMemberFromProject } from '../controllers/projectMember.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'LEADER']), addMemberToProject);

router.get('/:projectId', authenticate, authorize(['ADMIN', 'LEADER']), getProjectMembers);

router.delete('/:projectId/:userId', authenticate, authorize(['ADMIN', 'LEADER']), removeMemberFromProject);

export default router;
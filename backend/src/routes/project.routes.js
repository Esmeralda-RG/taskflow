import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject, addCustomPhase, updatePhase, deletePhase, getProjectWorkload, getProjectSummary } from '../controllers/project.controller.js';
import { addMemberToProject, getProjectMembers, removeMemberFromProject } from '../controllers/projectMember.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'LEADER']), createProject);
router.get('/', authenticate, authorize(['ADMIN', 'LEADER', 'EXECUTOR']), getProjects);
router.patch('/:id', authenticate, authorize(['ADMIN', 'LEADER']), updateProject);
router.delete('/:id', authenticate, authorize(['ADMIN', 'LEADER']), deleteProject);
router.post('/:id/phases', authenticate, authorize(['ADMIN', 'LEADER']), addCustomPhase);
router.patch('/:projectId/phases/:phaseId', authenticate, authorize(['ADMIN', 'LEADER']), updatePhase);
router.delete('/:projectId/phases/:phaseId', authenticate, authorize(['ADMIN', 'LEADER']), deletePhase);
router.get('/:projectId/members', authenticate, authorize(['ADMIN', 'LEADER']), getProjectMembers);
router.post('/:projectId/members', authenticate, authorize(['ADMIN', 'LEADER']), addMemberToProject);
router.delete('/:projectId/members/:userId', authenticate, authorize(['ADMIN', 'LEADER']), removeMemberFromProject);
router.get('/:id/summary', authenticate, authorize(['ADMIN', 'LEADER', 'EXECUTOR']), getProjectSummary);
router.get('/:id/workload', authenticate, authorize(['ADMIN', 'LEADER']), getProjectWorkload);

export default router;

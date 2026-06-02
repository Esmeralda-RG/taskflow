import { Router } from 'express';
import { createTask, updateTask, deleteTask, getTaskByProject, assignTask, logTime, moveTaskToPhase, createTaskComment, getTaskComments } from '../controllers/task.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'LEADER']), createTask);
router.get('/project/:projectId', authenticate, authorize(['ADMIN', 'LEADER', 'EXECUTOR']), getTaskByProject);
router.patch('/:id', authenticate, authorize(['ADMIN', 'LEADER']), updateTask);
router.delete('/:id', authenticate, authorize(['ADMIN', 'LEADER']), deleteTask);
router.patch('/:id/assignee', authenticate, authorize(['ADMIN', 'LEADER']), assignTask);
router.post('/:id/log-time', authenticate, logTime);
router.patch('/:id/phase', authenticate, moveTaskToPhase);
router.post('/:id/comments', authenticate, createTaskComment);
router.get('/:id/comments', authenticate, getTaskComments);

export default router;

import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authenticate } from '../middlewares/auth.middleware.js';
import { canAccessComment, uploadCommentAttachments } from '../controllers/comment.controller.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads/comments');

try {
    fs.mkdirSync(uploadsDir, { recursive: true });
} catch {
    // El directorio puede ser inaccesible en entornos de prueba
}

const allowedExtensions = new Set([
    '.pdf',
    '.docx',
    '.doc',
    '.txt',
    '.xlsx',
    '.xls',
    '.png',
    '.jpg',
    '.jpeg'
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        cb(null, safeName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedExtensions.has(extension)) {
            return cb(new Error('Formato de archivo no permitido'));
        }

        cb(null, true);
    }
});

const handleUpload = (req, res, next) => {
    upload.array('files')(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo supera el tamaño máximo de 10 MB'
            });
        }

        if (error.message === 'Formato de archivo no permitido') {
            return res.status(400).json({
                success: false,
                message: 'Formato de archivo no permitido'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Error al procesar el archivo'
        });
    });
};

const authorizeCommentAccess = async (req, res, next) => {
    try {
        const access = await canAccessComment(req.params.id, req.user);

        if (!access.allowed) {
            return res.status(access.status).json({
                success: false,
                message: access.message
            });
        }

        req.comment = access.comment;
        next();
    } catch (error) {
        console.error('Error al validar acceso al comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar acceso al comentario'
        });
    }
};

router.post('/:id/attachments', authenticate, authorizeCommentAccess, handleUpload, uploadCommentAttachments);

export default router;

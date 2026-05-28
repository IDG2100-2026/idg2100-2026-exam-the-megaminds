import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar-${req.params.userId}-${Date.now()}${ext}`);
    }
});

const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(Object.assign(new Error('Only JPEG, PNG and WebP images are allowed'), { status: 400 }), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter
});

export function handleAvatarUpload(req, res, next) {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 2 MB' : err.message;
            return res.status(err.status ?? 400).json({ success: false, message: msg });
        }
        next();
    });
}

const trophyDir = path.join(__dirname, '..', 'uploads', 'trophies');
fs.mkdirSync(trophyDir, { recursive: true });

const trophyStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, trophyDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `trophy-${Date.now()}${ext}`);
    }
});

const trophyUpload = multer({ storage: trophyStorage, limits: { fileSize: 2 * 1024 * 1024}, fileFilter});

export function handleTrophyUpload(req, res, next){
    trophyUpload.single('image')(req, res, (err) => {
        if (err){
            const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 2 MB' : err.message;
            return res.status(err.status ?? 400).json({ success: false, message: msg });
        }
        next();
    });
}
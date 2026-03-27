import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { imageDir } from "../utils/paths.js";

const router = Router();

/** Multer storage: save to public/images/{section}/{slug}/ */
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const { section, slug } = req.params;
    const dir = imageDir(section, slug);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    // Preserve original name, replace spaces with hyphens
    const safe = file.originalname.replace(/\s+/g, "-");
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    const allowed = /\.(jpe?g|png|gif|webp|svg|avif|mp4)$/i;
    cb(null, allowed.test(file.originalname));
  },
});

/**
 * POST /api/media/:section/:slug
 * Upload one or more images. Returns array of inserted markdown paths.
 */
router.post("/:section/:slug", upload.array("files", 20), (req, res) => {
  const { section, slug } = req.params;
  const files = (req.files || []).map((f) => ({
    filename: f.filename,
    size: f.size,
    markdown: `![${f.filename}](/images/${section}/${slug}/${f.filename})`,
    path: `/images/${section}/${slug}/${f.filename}`,
  }));
  res.json(files);
});

/**
 * GET /api/media/:section/:slug
 * List all images for a post.
 */
router.get("/:section/:slug", (req, res) => {
  const { section, slug } = req.params;
  const dir = imageDir(section, slug);
  if (!fs.existsSync(dir)) return res.json([]);

  const files = fs.readdirSync(dir).map((f) => ({
    filename: f,
    path: `/images/${section}/${slug}/${f}`,
    markdown: `![${f}](/images/${section}/${slug}/${f})`,
  }));
  res.json(files);
});

export default router;

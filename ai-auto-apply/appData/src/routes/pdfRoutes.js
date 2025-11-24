import express from 'express';
import multer from 'multer';
import { parseResume } from '../services/pdfParserService.js';

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/process-resume", upload.single("resume"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const parsed = await parseResume(filePath);

    res.json({
      success: true,
      ...parsed
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;

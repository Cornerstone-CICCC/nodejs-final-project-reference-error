import express from "express";
import multer from "multer";
import { questionController } from "../controllers/question.controller";
import { auth } from "../middleware/auth.middleware";

// Set up storage and limits for multer
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB file size limit
  },
});

const router = express.Router();

// Router authentication
router.use(auth);

// Question routes
router.get("/quiz/:quiz_id", questionController.getAllQuestionsByQuizId);
router.get("/:id", questionController.getQuestionById);
router.post("/", upload.single("picture"), questionController.createQuestion);
router.put("/:id", upload.single("picture"), questionController.updateQuestion);
router.delete("/:id", questionController.deleteQuestion);
export default router;

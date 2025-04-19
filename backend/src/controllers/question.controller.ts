import { Request, Response } from "express";
import { questionImage } from "../models/image.model";
import { QuestionModel } from "../models/question.model";
import { uploadImage } from "../types/image";
import { CreateQuestion, UpdateQuestion } from "../types/question";

const questionModel = new QuestionModel();
const imageService = new questionImage();

class QuestionController {
  async createQuestion(
    req: Request<Record<string, never>, Record<string, never>, CreateQuestion>, // Correct typing for POST (no URL params)
    res: Response,
  ): Promise<void> {
    try {
      const question = req.body;
      const newQuestion = await questionModel.createQuestion(question);
      if (req.file) {
        const imageInfo: uploadImage = {
          fileBuffer: req.file?.buffer,
          mimeType: req.file?.mimetype,
        };
        const uploadImage = await imageService.uploadImage(
          imageInfo,
          newQuestion.quizId,
          newQuestion.id,
        );
        if (uploadImage) {
          const question = {
            quizId: newQuestion.quizId,
            picture: uploadImage.imageUrl,
          };
          const questionWithImage = await questionModel.updateQuestion(newQuestion.id, question);
          res.status(201).json(questionWithImage);
        }
      } else {
        res.status(201).json(newQuestion);
      }
    } catch (error) {
      console.error("Error creating question", error);
      res.status(500).json({ error: "Error creating question" });
    }
  }

  async updateQuestion(req: Request<{ id: string }, null, UpdateQuestion>, res: Response) {
    const id = req.params.id;
    const question = req.body;
    try {
      const existingQuestion = await questionModel.getQuestionById(id);
      if (req.file && existingQuestion) {
        // delete the old image
        if (existingQuestion) {
          if (existingQuestion.picture) {
            await imageService.deleteImage(existingQuestion.picture);
          }
        }
        const imageInfo: uploadImage = {
          fileBuffer: req.file?.buffer,
          mimeType: req.file?.mimetype,
        };
        const uploadImage = await imageService.uploadImage(imageInfo, existingQuestion.quizId, id);
        if (uploadImage) {
          question.picture = uploadImage.imageUrl;
        }
      }
      const updatedQuestion = await questionModel.updateQuestion(id, question);
      res.status(200).json(updatedQuestion);
    } catch (error) {
      console.error("Error updating question", error);
      res.status(500).json({ error: "Error updating question" });
    }
  }

  async getAllQuestionsByQuizId(req: Request, res: Response) {
    const quizId = req.params.quiz_id;

    try {
      const questions = await questionModel.getAllQuestionsByQuizId(quizId);
      res.status(200).json(questions);
    } catch (error) {
      console.error("Error fetching questions", error);
      res.status(500).json({ error: "Error fetching questions" });
    }
  }

  async getQuestionById(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const question = await questionModel.getQuestionById(id);
      if (question) {
        res.status(200).json(question);
      } else {
        res.status(404).json({ error: "Question not found" });
      }
    } catch (error) {
      console.error("Error fetching question", error);
      res.status(500).json({ error: "Error fetching question" });
    }
  }

  async deleteQuestion(req: Request, res: Response) {
    const id = req.params.id;
    try {
      const question = await questionModel.getQuestionById(id);
      let imageUrl = "";
      if (question) {
        imageUrl = question.picture;
      }
      const deleted = await imageService.deleteImage(imageUrl);
      if (!deleted) {
        res.status(404).json({ message: "Could not delete the image" });
        return;
      }
      const deletedQuestion = await questionModel.deleteQuestion(id);
      res.status(200).json(deletedQuestion);
    } catch (error) {
      console.error("Error deleting question", error);
      res.status(500).json({ error: "Error deleting question" });
    }
  }
}

export const questionController = new QuestionController();

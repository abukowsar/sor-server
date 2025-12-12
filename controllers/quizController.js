import { Quiz } from "../models/quiz/QuizModel.js";
import { Chapter } from "../models/Book/chapterModel.js";
import { QuizSubmission } from "../models/quiz/quizsubmissoin.js";
import { Module } from "../models/Course/moduleModel.js";

export const getQuizByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    
    // Check if chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found"
      });
    }
    
    // Find quiz associated with the chapter
    const quiz = await Quiz.findOne({ chapterId });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "No quiz found for this chapter"
      });
    }
    
    // Check if user has already submitted this quiz
    let submission = null;
    if (req.user?._id) {
      submission = await QuizSubmission.findOne({
        userId: req.user._id,
        quizId: quiz._id
      }).select('score passed createdAt');
    }
    
    return res.status(200).json({
      success: true,
      message: "Quiz fetched successfully",
      data: {
        quiz,
        userSubmission: submission
      }
    });
    
  } catch (error) {
    console.error("Get quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz",
      error: error.message
    });
  }
};


export const getQuizByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // Check if chapter exists
    const chapter = await Module.findById(moduleId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // Find quiz associated with the chapter
    const quiz = await Quiz.findOne({ moduleId });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "No quiz found for this Module",
      });
    }

    // Check if user has already submitted this quiz
    let submission = null;
    if (req.user?._id) {
      submission = await QuizSubmission.findOne({
        userId: req.user._id,
        quizId: quiz._id,
      }).select("score passed createdAt");
    }

    return res.status(200).json({
      success: true,
      message: "Quiz fetched successfully",
      data: {
        quiz,
        userSubmission: submission,
      },
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz",
      error: error.message,
    });
  }
};


export const getQuizSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user._id;
    
    // Find the submission
    const submission = await QuizSubmission.findById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }
    
    // Security check - users can only view their own submissions
    if (submission.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this submission"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Quiz submission retrieved successfully",
      data: submission
    });
  } catch (error) {
    console.error("Error retrieving quiz submission:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quiz submission",
      error: error.message
    });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Quiz retrieved successfully",
      data: quiz
    });
  } catch (error) {
    console.error("Error retrieving quiz:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quiz",
      error: error.message
    });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const { title, chapterId, moduleId, questions } = req.body;

    // Validate that either chapterId or moduleId is provided, but not both
    if ((!chapterId && !moduleId) || (chapterId && moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request. Provide either chapterId or moduleId"
      });
    }

    // Handle chapter quiz
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found"
        });
      }

      const existingChapterQuiz = await Quiz.findOne({ chapterId });
      if (existingChapterQuiz) {
        return res.status(400).json({
          success: false,
          message: "Quiz already exists for this chapter"
        });
      }
    }

    // Handle module quiz
    if (moduleId) {
      const module = await Module.findById(moduleId);
      if (!module) {
        return res.status(404).json({
          success: false,
          message: "Module not found"
        });
      }

      const existingModuleQuiz = await Quiz.findOne({ moduleId });
      if (existingModuleQuiz) {
        return res.status(400).json({
          success: false,
          message: "Quiz already exists for this module"
        });
      }
    }

    // Create quiz with appropriate reference
    const quiz = await Quiz.create({
      title,
      chapterId: chapterId || null,
      moduleId: moduleId || null,
      questions
    });

    // Update the corresponding parent with quiz reference
    if (chapterId) {
      await Chapter.findByIdAndUpdate(chapterId, { quizId: quiz._id });
    }
    if (moduleId) {
      await Module.findByIdAndUpdate(moduleId, { quizId: quiz._id });
    }

    return res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: quiz
    });

  } catch (error) {
    console.error("Create quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create quiz",
      error: error.message
    });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, selectedOptions } = req.body;
    const userId = req.user?._id;

    console.log('Submitting quiz:', {
      userId: userId.toString(),
      quizId,
      selectedOptionsCount: selectedOptions.length
    });

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    // Check if already submitted
    const existingSubmission = await QuizSubmission.findOne({
      userId,
      quizId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "Quiz already submitted"
      });
    }

    // Calculate score
    let score = 0;
    selectedOptions.forEach(answer => {
      const question = quiz.questions.find(q => q.questionNo === answer.questionNo);
      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption && correctOption.text === answer.text) {
          score++;
        }
      }
    });

    // Calculate pass/fail (e.g., 60% passing mark)
    const totalQuestions = quiz.questions.length;
    const percentageScore = (score / totalQuestions) * 100;
    const passed = percentageScore >= 60;

    // Create submission
    const submission = await QuizSubmission.create({
      userId,
      quizId,
      selectedOptions,
      score,
      passed
    });

    console.log('Quiz submission created:', submission._id.toString());

    return res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        submissionId: submission._id,
        score,
        totalQuestions,
        percentageScore,
        passed
      }
    });

  } catch (error) {
    console.error("Quiz submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
      error: error.message
    });
  }
};

 

export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, questions } = req.body;

    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }
 
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      {
        title,
        questions: questions.map((q, index) => ({
          ...q,
          questionNo: index + 1
        }))
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: updatedQuiz
    });

  } catch (error) {
    console.error("Update quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update quiz",
      error: error.message
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    
    if (quiz.chapterId) {
      await Chapter.findByIdAndUpdate(quiz.chapterId, {
        $unset: { quizId: "" }
      });
    }
    
    if (quiz.moduleId) {
      await Module.findByIdAndUpdate(quiz.moduleId, {
        $unset: { quizId: "" }
      });
    }

   
    await QuizSubmission.deleteMany({ quizId });

    
    await Quiz.findByIdAndDelete(quizId);

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully"
    });

  } catch (error) {
    console.error("Delete quiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete quiz",
      error: error.message
    });
  }
};


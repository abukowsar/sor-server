import { Book } from "../models/Book/bookModel.js";
import { Chapter } from "../models/Book/chapterModel.js";
import { Quiz } from "../models/quiz/QuizModel.js";
import { QuizSubmission } from "../models/quiz/quizsubmissoin.js";
import { User } from "../models/User/userModel.js";
import { BookProgress } from "../models/Book/bookProgressModel.js";

// Create a new book (Admin only)
export const createBook = async (req, res) => {
  try {
    const { name, description, thumbnail, plan, author } = req.body;

    if (!name || !description || !plan) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const newBook = new Book({
      name,
      description,
      thumbnail,
      plan,
      author,
      createdBy: req.user._id
    });

    await newBook.save();

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create book"
    });
  }
};

// Get all books based on user's plan
export const getAllBooks = async (req, res) => {
  try {
    // If user is admin, return all books
    if (req.user.role === 'admin') {
      const books = await Book.find();
      return res.status(200).json({
        success: true,
        message: "Books fetched successfully",
        data: books
      });
    }

    const user = await User.findById(req.user._id);
    const now = new Date();
    const subscriptionEndDate = user.subscription?.endDate;
    const subscriptionStartDate = user.subscription?.startDate;

    // Get books based on subscription period and plan
    const books = await Book.find({
      $and: [
        { plan: user?.subscription?.plan },
        {
          createdAt: {

            $lte: subscriptionEndDate || now
          }
        }
      ]
    }).select('-createdBy');

    return res.status(200).json({
      success: true,
      message: "Books fetched successfully",
      data: books,
      subscription: {
        plan: user.subscription.plan,
        isActive: subscriptionEndDate > now,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate
      }
    });

  } catch (error) {
    console.error("Error fetching books:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch books"
    });
  }
};

// Get single book details
export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("book Id ", id)
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // If user is admin, return book without plan check
    if (req.user.role === 'admin') {
      return res.status(200).json({
        success: true,
        message: "Book details fetched successfully",
        data: book
      });
    }
    const user = await User.findById(req.user._id);
    // console.log(user)


    // For regular users, check plan access
    const userPlan = user.subscription.plan || "free";
    const planAccess = {
      basic: ["basic"],
      standard: ["basic", "standard"],
      premium: ["basic", "standard", "premium"]
    };

    if (!planAccess[userPlan].includes(book.plan)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this book"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book details fetched successfully",
      data: book
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch book details"
    });
  }
};

// delete book
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book exists
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // // Get all chapters for this book
    const chapters = await Chapter.find({ bookId: id });
    const chapterIds = chapters.map(chapter => chapter._id);



    // // Delete all chapters
    await Chapter.deleteMany({ bookId: id });

    // Delete the book
    await Book.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Book and all related data deleted successfully"
    });
  } catch (error) {
    console.error("Delete book error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete book",
      error: error.message
    });
  }
};

// Update book details
export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, author, description, thumbnail, plan } = req.body;

    // Check if book exists
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Check if user is admin (optional if already handled by middleware)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can update books"
      });
    }

    // Create update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (author) updateData.author = author;
    if (description) updateData.description = description;
    if (thumbnail) updateData.thumbnail = thumbnail;
    if (plan) updateData.plan = plan;

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook
    });
  } catch (error) {
    console.error("Update book error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update book",
      error: error.message
    });
  }
};

// Add chapter
export const addChapter = async (req, res) => {
  try {
    const { bookId, title, chapterNo, pdfUrl } = req.body;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Check if chapter number already exists for this book
    const existingChapter = await Chapter.findOne({ bookId, chapterNo });
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: "Chapter number already exists for this book"
      });
    }

    // Create new chapter
    const newChapter = await Chapter.create({
      title,
      chapterNo,
      bookId,
      pdfUrl
    });

    // Add chapter reference to book's chapters array
    await Book.findByIdAndUpdate(
      bookId,
      { $push: { chapters: newChapter._id } },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Chapter added successfully",
      data: newChapter
    });

  } catch (error) {
    console.error("Add chapter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add chapter",
      error: error.message
    });
  }
};

// get chapters
export const getChapter = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(400).json({
        success: false,
        message: "Book not found"
      });
    }

    // Get all chapters with their quizzes
    const chapters = await Chapter.find({ bookId })
      .sort({ chapterNo: 1 })
      .populate({
        path: 'quizId',
        select: 'title questions'
      });

    // Get this user's quiz submissions for this book's chapters
    const quizIds = chapters
      .filter(chapter => chapter.quizId) // Only chapters with quizzes
      .map(chapter => chapter.quizId?._id); // Get quiz IDs

    console.log("quizids", quizIds, "uederid", req.user?._id);

    const userSubmissions = await QuizSubmission.find({
      userId: req.user?._id,
      quizId: { $in: quizIds }
    });
    console.log('userSubmissions', userSubmissions)

    // Mark chapters as completed based on quiz submissions
    const chaptersWithProgress = chapters.map(chapter => {
      // For each chapter, check if user submitted its quiz
      const hasSubmittedQuiz = userSubmissions.some(
        submission => submission.quizId.toString() === chapter.quizId?._id.toString()
      );

      return {
        ...chapter.toObject(),
        quizSubmitted: hasSubmittedQuiz
      };
    });

    return res.status(200).json({
      success: true,
      message: "Chapters fetched successfully",
      data: chaptersWithProgress
    });

  } catch (error) {
    console.error("Fetch chapters error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chapters"
    });
  }
};


export const updateChapter = async (req, res) => {
  const chapterId = req.params.chapterId

  const { title, pdfUrl, chapterNo } = req.body;

  try {

    const chapter = await Chapter.findOne({ _id: chapterId })
    console.log("chapter", chapter)
    if (!chapter) {
      return res.status(400).json({
        success: false,
        message: "Chapter not found"
      });
    }

    const updateChapter = await Chapter.findByIdAndUpdate(chapterId, { title, pdfUrl, chapterNo },
      { new: true }
    )

    console.log("updateChapter", updateChapter)

    return res.status(200).json({
      success: true,
      message: "Chapter updated successfully",

    })

  } catch (error) {

    console.error("Update chapter error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update chapter",
      error: error.message
    });

  }


}

export const deleteChapter = async (req, res) => {
  const { chapterId } = req.params;

  console.log("chapterId", chapterId)

  try {

    const result = await Chapter.findByIdAndDelete(chapterId);



    if (result) {

      const bookId = result.bookId;

      const removeQuiz = await Quiz.findOneAndDelete({ chapterId: chapterId })

      const removechapter = await Book.findByIdAndUpdate(bookId, { $pull: { chapters: chapterId } })

      // console.log("removechapter", removechapter)

      return res.status(200).json({
        success: true,
        message: "Chapter deleted successfully",
      })
    }

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Chapter not found"
      })
    }


  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete chapter",
      error: error.message
    })
  }

}



export const getBooksFree = async (req, res) => {


  try {
    const { plan, title, limit = 10, page = 1 } = req.body;
    let query = {};
    let skip = (page - 1) * limit;
    if (plan) {

      query.plan = plan;

    }
    if (title) {
      query.title = title;
    }

    const allBooks = await Book.find(query).populate({
      path: 'chapters',
      select: 'title chapterNo'
    }).skip(skip).limit(limit)

    if (allBooks) {
      return res.status(200).json({
        success: true,
        message: "Books here ",
        books: allBooks
      })
    }

  } catch (error) {

    console.log(error)
    res.status(400).json({
      success: false,
      message: "Error"
    })

  }
}

export const getBookFree = async (req, res) => {

  try {
    const { bookId } = req.params;
    console.log("book Id", bookId)


    const book = await Book.findById(bookId).populate({ path: "chapters", select: "title chapterNo" })
    if (book) {
      return res.status(200).json({
        success: true,
        message: "Books Find ",
        data: book
      })
    }

  } catch (error) {
    console.log(error)
    res.status(400).json({
      success: false,
      message: "Error"
    })

  }

}


// Add this function to get book progress
export const getBookProgress = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    // Find or create progress
    let bookProgress = await BookProgress.findOne({ userId, bookId });

    if (!bookProgress) {
      bookProgress = new BookProgress({
        userId,
        bookId,
        completedChapters: []
      });
      await bookProgress.save();
    }

    return res.status(200).json({
      success: true,
      message: "Book progress retrieved successfully",
      data: bookProgress
    });
  } catch (error) {
    console.error("Get book progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get book progress",
      error: error.message
    });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Find or create progress
    let courseProgress = await CourseProgress.findOne({ userId, courseId });

    if (!courseProgress) {
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completedModules: [],
        lastModulesId: null
      });
      await courseProgress.save();
    }

    return res.status(200).json({
      success: true,
      message: "Course progress retrieved successfully",
      data: courseProgress
    });
  } catch (error) {
    console.error("Get course progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get course progress",
      error: error.message
    });
  }
};


// Get user's reading progress across all books
export const getUserReadingProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all book progress records for this user
    const bookProgressRecords = await BookProgress.find({ userId })
      .populate('bookId', 'name thumbnail plan chapters')
      .populate('completedChapters', 'title chapterNo')
      .populate('lastReadChapterId', 'title chapterNo');
    
    // Format response data
    const formattedProgress = bookProgressRecords.map(record => {
      const totalChapters = record.bookId?.chapters?.length || 0;
      const completedChapters = record.completedChapters?.length || 0;
      
      return {
        bookId: record.bookId?._id,
        name: record.bookId?.name,
        thumbnail: record.bookId?.thumbnail,
        plan: record.bookId?.plan,
        completedChapters: record.completedChapters || [],
        lastReadChapterId: record.lastReadChapterId?._id || null,
        lastReadChapterTitle: record.lastReadChapterId?.title || null,
        lastReadAt: record.updatedAt,
        percentage: totalChapters > 0 ? (completedChapters / totalChapters) : 0
      };
    });
    
    return res.status(200).json({
      success: true,
      message: "Reading progress retrieved successfully",
      data: formattedProgress
    });
  } catch (error) {
    console.error("Error getting reading progress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reading progress",
      error: error.message
    });
  }
};

// Update book progress when starting a chapter
export const updateLastReadChapter = async (req, res) => {
  try {
    const { bookId, chapterId } = req.body;
    const userId = req.user._id;
    
    // Find or create book progress
    let bookProgress = await BookProgress.findOne({ userId, bookId });
    
    if (!bookProgress) {
      bookProgress = new BookProgress({
        userId,
        bookId,
        completedChapters: [],
        lastReadChapterId: chapterId
      });
    } else {
      bookProgress.lastReadChapterId = chapterId;
    }
    
    await bookProgress.save();
    
    return res.status(200).json({
      success: true,
      message: "Reading progress updated successfully",
      data: bookProgress
    });
  } catch (error) {
    console.error("Error updating reading progress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update reading progress",
      error: error.message
    });
  }
};

// Update book progress when completing a quiz
export const markChapterComplete = async (req, res) => {
  try {
    const { bookId, chapterId } = req.body;
    const userId = req.user._id;
    
    console.log(`Marking chapter complete: Book ${bookId}, Chapter ${chapterId}, User ${userId}`);
    
    // Find book progress
    let bookProgress = await BookProgress.findOne({ userId, bookId });
    
    if (!bookProgress) {
      // Create new progress record if it doesn't exist
      bookProgress = new BookProgress({
        userId,
        bookId,
        completedChapters: [chapterId],
        lastReadChapterId: chapterId
      });
    } else {
      // Check if chapter is already marked as completed
      const alreadyCompleted = bookProgress.completedChapters
        .map(id => id.toString())
        .includes(chapterId.toString());
        
      // Add to completed chapters if not already included
      if (!alreadyCompleted) {
        bookProgress.completedChapters.push(chapterId);
      }
    }
    
    await bookProgress.save();
    
    return res.status(200).json({
      success: true,
      message: "Chapter marked as completed",
      data: bookProgress
    });
  } catch (error) {
    console.error("Error marking chapter as complete:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark chapter as complete",
      error: error.message
    });
  }
};
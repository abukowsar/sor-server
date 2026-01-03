import { Chapter } from "../models/Book/chapterModel.js";
import { Course } from "../models/Course/courseModel.js";
import { Module } from "../models/Course/moduleModel.js";
import { QuizSubmission } from "../models/quiz/quizsubmissoin.js";
import { User } from "../models/User/userModel.js";



export const addCourse = async (req, res) => {
  try {
    const { title, description, image, tutor, plan, outlinePdf } = req.body;

    if (!title || !description || !image || !tutor || !plan) {
      return res.status(400).json({ message: "All fields are required" });

    }

    const newCourse = new Course({
      title,
      description,
      image,
      tutor,
      plan,
      outlinePdf,
      createdBy: req.user._id

    });
    await newCourse.save();

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create Course",
      error
    });
  }
}


// Get all books based on user's plan
export const getAllCourse = async (req, res) => {

  console.log(req.user.role, "role");
  try {
    // If user is admin, return all books
    if (req.user.role === 'admin') {
      const course = await Course.find();
      return res.status(200).json({
        success: true,
        message: "Course fetched successfully",
        data: course
      });
    }

    const user = await User.findById(req.user._id);
    const now = new Date();
    const subscriptionEndDate = user.subscription?.endDate;
    const subscriptionStartDate = user.subscription?.startDate;

    // Get books based on subscription period and plan
    const course = await Course.find({
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
      message: "course fetched successfully",
      data: course,
      subscription: {
        plan: user.subscription.plan,
        isActive: subscriptionEndDate > now,
        startDate: subscriptionStartDate,
        endDate: subscriptionEndDate
      }
    });

  } catch (error) {
    console.error("Error fetching course:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course"
    });
  }
};

 
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Course Id:", id);

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // If user is admin → return full access
    if (req.user.role === "admin") {
      return res.status(200).json({
        success: true,
        message: "Course details fetched successfully",
        data: course,
      });
    }

    // Get logged in user
    const user = await User.findById(req.user._id);

    const userPlan = user?.subscription?.plan || "free";

    // Set which plans can access which courses
    const planAccess = {
      free: ["free"],
      basic: ["basic"],
      standard: ["basic", "standard"],
      premium: ["basic", "standard", "premium"],
    };

    // If user does NOT have access based on plan
    if (!planAccess[userPlan]?.includes(course.plan)) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this course",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: course,
    });

  } catch (error) {
    console.error("Error fetching course by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
    });
  }
};



//update 

export const updateCourse = async (req, res) => {
  try {
    const { courseId, title, description, image, tutor, plan, outlinePdf } =
      req.body;

    if (!courseId) {
      return res.status(400).json({ message: " course id is required " });
    }


    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { title, description, image, tutor, plan, outlinePdf },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update course",
      error
    });
  }
}


// delete  
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log(courseId, "courseId");

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const deletedCourse = await Course.findByIdAndDelete(courseId);

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error
    });
  }
}


// add module 
export const addModule = async (req, res) => {
  try {
    const { courseId, title, videoLinks, moduleNo } = req.body;

    if (!courseId || !title || !videoLinks || !moduleNo) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the moduleNo is unique for the course
    const existingModule = await Module.findOne({
      courseId,
      moduleNo
    });
    if (existingModule) {
      return res.status(400).json({ message: "Module number already exists for this course" });
    }

    // Create the new module
    const newModule = await Module.create({
      courseId,
      title,
      moduleNo,
      videoLinks,
      quizId: null,
      createdBy: req.user._id
    });

    // Add Module reference to course's modules array
    await Course.findByIdAndUpdate(
      courseId,
      { $push: { modules: newModule._id } },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Module added successfully",
      data: newModule
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add module",
      error: error.message
    });
  }
};


export const getModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log("id" , courseId
      
    )

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found"
      });
    }

    // Get all modules with their quizzes
    const modules = await Module.find({ courseId })
      .sort({ moduleNo: 1 })
      .populate({
        path: 'quizId',
        select: 'title questions'
      });

    // Get this user's quiz submissions for this course's modules
    const quizIds = modules
      .filter(module => module.quizId)
      .map(module => module.quizId?._id);

    const userSubmissions = await QuizSubmission.find({
      userId: req.user?._id,
      quizId: { $in: quizIds }
    });

    // Mark modules as completed based on quiz submissions
    const modulesWithProgress = modules.map(module => {
      const hasSubmittedQuiz = userSubmissions.some(
        submission => submission.quizId.toString() === module.quizId?._id.toString()
      );
      return {
        ...module.toObject(),
        quizSubmitted: hasSubmittedQuiz
      };
    });

    return res.status(200).json({
      success: true,
      message: "Modules fetched successfully",
      data: modulesWithProgress
    });

  } catch (error) {
    console.error("Fetch modules error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch modules"
    });
  }
};



 
export const getAllCourseFree = async (req, res) => {
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

    const courses = await Course.find(query)
      .populate({
        path: "modules",
        select: "title moduleNo"
      })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: courses,
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Failed to fetch free courses",
    });
  }
};


// SINGLE COURSE (FREE)
export const getCourseFree = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate({
        path: "modules",
        select: "title moduleNo videoLinks"
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error fetching course"
    });
  }
};

 


export const deleteModule = async (req, res) => {
  const { moduleId } = req.params;

  try {
    // Delete the module
    const deletedModule = await Module.findByIdAndDelete(moduleId);

    if (!deletedModule) {
      return res.status(400).json({
        success: false,
        message: "Module not found"
      });
    }

    const courseId = deletedModule.courseId;

    // Remove quiz linked to module
    if (deletedModule.quizId) {
      await Quiz.findOneAndDelete({ _id: deletedModule.quizId });
    }

    // Remove module reference from Course.modules
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { modules: moduleId } }
    );

    return res.status(200).json({
      success: true,
      message: "Module deleted successfully"
    });

  } catch (error) {
    console.error("Delete module error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete module",
      error: error.message
    });
  }
};


export const updateModule = async (req, res) => {
  const moduleId = req.params.moduleId;
  const { title, videoLinks, moduleNo } = req.body;

  try {
    const moduleData = await Module.findOne({ _id: moduleId });

    if (!moduleData) {
      return res.status(400).json({
        success: false,
        message: "Module not found",
      });
    }

    // Update the module
    const updatedModule = await Module.findByIdAndUpdate(
      moduleId,
      { title, videoLinks, moduleNo },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Module updated successfully",
      data: updatedModule,
    });
  } catch (error) {
    console.error("Update module error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update module",
      error: error.message,
    });
  }
};

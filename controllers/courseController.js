import { Course } from "../models/Course/courseModel.js";
import { User } from "../models/User/userModel.js";



export const addCourse =async (req, res) => {
   try{
     const { title, description, image, tutor, plan } = req.body;

    if (!title || !description || !image || !tutor || !plan) {
        return res.status(400).json({ message: "All fields are required" });

    }

    const newCourse = new Course({
        title,
        description,
        image,
        tutor,
        plan ,
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
export const getAllBooks = async (req, res) => {

    console.log(req.user.role , "role");
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



//update 

export const updateCourse = async(req ,res)=>{
  try {
    const { courseId, title, description, image, tutor, plan } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: " course id is required " });
    }


    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { title, description, image, tutor, plan },
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
export const deleteCourse = async(req , res)=>{
  try {
    const { courseId } = req.params ;
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
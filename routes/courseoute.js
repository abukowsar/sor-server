import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { addCourse, deleteCourse, getAllBooks, updateCourse } from '../controllers/courseController.js';


const courseRoute = express.Router();

courseRoute.post("/create" ,  auth("admin") ,  addCourse)
courseRoute.put("/update" ,  auth("admin") ,  updateCourse)
courseRoute.delete("/delete/:courseId" ,  auth("admin") ,  deleteCourse)

courseRoute.get("/getAll" ,  auth('student', 'admin') , getAllBooks)





export default courseRoute ;
import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { addCourse, addModule, deleteCourse, getAllCourse, getAllCourseFree, getCourseFree, getModule, updateCourse } from '../controllers/courseController.js';


const courseRoute = express.Router();

courseRoute.post("/create" ,  auth("admin") ,  addCourse)
courseRoute.put("/update" ,  auth("admin") ,  updateCourse)
courseRoute.delete("/delete/:courseId" ,  auth("admin") ,  deleteCourse)

courseRoute.get("/getAll" ,  auth('student', 'admin') , getAllCourse)



courseRoute.post('/add-module', auth(  'admin'), addModule ) 

//// chapter
courseRoute.get('/get-module/:courseId' , auth('student', 'admin'),getModule ) 

// bookRouter.patch('/update-chapter/:chapterId', auth('admin'), updateChapter);

// bookRouter.delete('/delete-chapter/:chapterId', auth("admin") ,deleteChapter)



courseRoute.get("/getAllCourseFree", getAllCourseFree);
courseRoute.get("/getCourseFree/:courseId", getCourseFree);






export default courseRoute ;
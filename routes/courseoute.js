import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { addCourse, addModule, deleteCourse, deleteModule, getAllCourse, getAllCourseFree, getCourseById, getCourseFree, getModule, updateCourse, updateModule } from '../controllers/courseController.js';


const courseRoute = express.Router();

courseRoute.post("/create" ,  auth("admin") ,  addCourse)
courseRoute.put("/update" ,  auth("admin") ,  updateCourse)
courseRoute.delete("/delete/:courseId" ,  auth("admin") ,  deleteCourse)

courseRoute.get("/getAll" ,  auth('student', 'admin') , getAllCourse)


courseRoute.get("/:id" ,  auth('student', 'admin') , getCourseById)



courseRoute.post('/add-module', auth(  'admin'), addModule ) 

//// chapter
courseRoute.get('/get-module/:courseId' , auth('student', 'admin'),getModule ) 



courseRoute.patch("/update-module/:moduleId", auth("admin"), updateModule);

courseRoute.delete("/delete-module/:moduleId", auth("admin"), deleteModule);





courseRoute.get("/getAllCourseFree", getAllCourseFree);
courseRoute.get("/getCourseFree/:courseId", getCourseFree);






export default courseRoute ;
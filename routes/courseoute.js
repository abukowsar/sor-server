import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { addCourse, getAllBooks } from '../controllers/courseController.js';


const courseRoute = express.Router();

courseRoute.post("/create" ,  auth("admin") ,  addCourse)

courseRoute.get("/getAll" ,  auth('student', 'admin') , getAllBooks)





export default courseRoute ;
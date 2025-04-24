import express from 'express';
import { 
  createOlympiad,
  getAllOlympiads,
  updateOlympiad,
  deleteOlympiad,
  
} from '../controllers/olympiadController.js';
import auth from '../middleware/authMiddleware.js';

const olympiadRouter = express.Router();

// Admin routes
olympiadRouter.post('/create', auth('admin'), createOlympiad);
olympiadRouter.patch('/update/:id', auth('admin'), updateOlympiad);
olympiadRouter.delete('/delete/:id', auth('admin'), deleteOlympiad);

// Public routes
olympiadRouter.get('/all', getAllOlympiads);

export default olympiadRouter;
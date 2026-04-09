import express from 'express';
import auth from '../middleware/authMiddleware.js';
import {
  createPlan,
  deletePlan,
  getAllPlans,
  getAPlan,
  updatePlan,
  createShurjoPayment,
  paymentSuccess,
  paymentStatusUpdate,
  getTransactionById,
  verifyPaymentAndGetTransaction
} from '../controllers/subscriptionPlanController.js';
import { urlEncoderMiddleware } from '../middleware/urlEncoderMiddleware.js';

const router = express.Router();

// Payment routes should come before dynamic routes
router.post("/create-ssl-payment", auth("student"), createShurjoPayment);
router.post("/success-payment", urlEncoderMiddleware, paymentSuccess);
router.post("/payment-status-update", paymentStatusUpdate); // IPN endpoint
router.get("/verify-payment", auth("student", "admin"), verifyPaymentAndGetTransaction); // Verify payment and get transaction
router.get('/transaction/:transactionId', auth('student', 'admin'), getTransactionById);

// Admin routes
router.post('/create', auth('admin'), createPlan);
router.patch('/update/:id', auth('admin'), updatePlan);
router.delete('/delete/:id', auth('admin'), deletePlan);

// Public routes
router.get('/all', getAllPlans);
router.get('/:id', getAPlan);

export default router;
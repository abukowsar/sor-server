import axios from "axios";
import { SubscriptionPlan } from "../models/Subscription/subscriptionPlanModel.js";
import { User } from "../models/User/userModel.js";
import { ObjectId } from "mongodb";
import { PaymentSession } from "../models/Subscription/paymentSessionModel.js";
import { Transaction } from "../models/Subscription/transactionModel.js";
import { createRequire } from "module";

// Use createRequire to import CommonJS module in ES module context
const require = createRequire(import.meta.url);
const shurjopay = require("shurjopay");

// Initialize ShurjoPay instance
const sp = shurjopay();

// Configure ShurjoPay with environment variables
const SP_ENDPOINT = process.env.SP_ENDPOINT || "https://sandbox.shurjopayment.com";
const SP_USERNAME = process.env.SP_USERNAME;
const SP_PASSWORD = process.env.SP_PASSWORD;
const SP_PREFIX = process.env.SP_PREFIX;
const SP_RETURN_URL = process.env.SP_RETURN_URL || `${process.env.SERVER_URL || process.env.API_URL || 'http://localhost:7000'}/api/plan/success-payment`;

console.log("=".repeat(60));
console.log("⚙️ [SHURJOPAY] Initializing ShurjoPay configuration");
console.log(`🔗 [SHURJOPAY] Endpoint: ${SP_ENDPOINT}`);
console.log(`👤 [SHURJOPAY] Username: ${SP_USERNAME ? '***' + SP_USERNAME.slice(-4) : 'NOT SET'}`);
console.log(`🔑 [SHURJOPAY] Password: ${SP_PASSWORD ? '***' : 'NOT SET'}`);
console.log(`🏷️ [SHURJOPAY] Prefix: ${SP_PREFIX || 'NOT SET'}`);
console.log(`↩️ [SHURJOPAY] Return URL: ${SP_RETURN_URL}`);
console.log("=".repeat(60));

// Function to configure ShurjoPay
const configureShurjoPay = () => {
  const endpoint = process.env.SP_ENDPOINT || "https://sandbox.shurjopayment.com";
  const username = process.env.SP_USERNAME;
  const password = process.env.SP_PASSWORD;
  const prefix = process.env.SP_PREFIX;
  const returnUrl = process.env.SP_RETURN_URL || `${process.env.SERVER_URL || process.env.API_URL || 'http://localhost:7000'}/api/plan/success-payment`;

  if (!username || !password || !prefix) {
    console.error("❌ [SHURJOPAY] Missing required environment variables!");
    console.error("Required: SP_USERNAME, SP_PASSWORD, SP_PREFIX");
    return false;
  }

  try {
    sp.config(
      endpoint,
      username,
      password,
      prefix,
      returnUrl
    );
    console.log("✅ [SHURJOPAY] Configuration completed");
    return true;
  } catch (error) {
    console.error("❌ [SHURJOPAY] Configuration error:", error.message);
    return false;
  }
};

// Initial configuration
configureShurjoPay();




// Create new subscription plan (Admin only)
export const createPlan = async (req, res) => {
  try {
    const { name, price, duration, features,   description } = req.body;

    const newPlan = await SubscriptionPlan.create({
      name,
      price,
      duration,
      features,
       
      description
    });

    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data: newPlan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all subscription plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });

    return res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      data: plans
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//get only one data by id
export const getAPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findById(id)

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'plan not found!'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Plan fetched successfully!',
      data: plan
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// Update subscription plan (Admin only)
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent name modification
    if (updates.name) {
      delete updates.name;
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data: plan
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Plan deleted successfully!'
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong!'
    })
  }
}



// // Payment route
// import SSLCommerzPayment from 'sslcommerz-lts';
// import { v4 as uuidv4 } from 'uuid';

 
// Generate random string for order ID
const randomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createShurjoPayment = async (req, res) => {
  console.log("=".repeat(60));
  console.log("🚀 [PAYMENT] Starting payment initiation process");
  console.log("=".repeat(60));
  
  try {
    const { planId } = req.body;
    console.log(`📋 [PAYMENT] Request received - Plan ID: ${planId}, User ID: ${req.user._id}`);

    // Fetch user data
    console.log(`👤 [PAYMENT] Fetching user data for ID: ${req.user._id}`);
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error(`❌ [PAYMENT] User not found: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    console.log(`✅ [PAYMENT] User found: ${user.name} (${user.email || user.phone})`);

    // Validate plan
    console.log(`📦 [PAYMENT] Validating subscription plan: ${planId}`);
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      console.error(`❌ [PAYMENT] Plan not found: ${planId}`);
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found"
      });
    }
    console.log(`✅ [PAYMENT] Plan validated: ${plan.name} - BDT ${plan.price} (${plan.duration} months)`);

    // Generate unique order ID with prefix
    const order_id = `${process.env.SP_PREFIX || 'SOR'}-${randomString(10)}`;
    console.log(`🆔 [PAYMENT] Generated order ID: ${order_id}`);

    // Prepare payment payload
    const payload = {
      prefix: process.env.SP_PREFIX,
      token: '', // Will be set by ShurjoPay
      return_url: process.env.SP_RETURN_URL || `${process.env.SERVER_URL}/api/plan/success-payment`,
      cancel_url: process.env.SP_CANCEL_URL || `${process.env.CLIENT_URL}/payment/cancel`,
      store_id: '', // Will be set by ShurjoPay
      amount: plan.price,
      order_id: order_id,
      currency: 'BDT',
      customer_name: user.name || 'Customer',
      customer_address: user.address?.district || 'Bangladesh',
      customer_email: user.email || 'customer@example.com',
      customer_phone: user.phone?.toString() || '01700000000',
      customer_city: user.address?.district || 'Dhaka',
      customer_post_code: '1200',
      client_ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
      value1: user._id.toString(),
      value2: planId.toString(),
      value3: plan.duration.toString(),
      value4: plan.name
    };
    console.log(`📝 [PAYMENT] Payment payload prepared:`, {
      order_id: payload.order_id,
      amount: payload.amount,
      currency: payload.currency,
      customer_name: payload.customer_name,
      return_url: payload.return_url
    });

    // Store payment session in database
    console.log(`💾 [PAYMENT] Creating payment session in database...`);
    const paymentSession = await PaymentSession.create({
      userId: user._id,
      planId: plan._id,
      transactionId: order_id,
      amount: plan.price,
      status: 'PENDING',
      paymentSessionData: payload,
      gatewayPageURL: '' // Will be updated after payment initiation
    });
    console.log(`✅ [PAYMENT] Payment session created successfully - Session ID: ${paymentSession._id}`);

    // Validate and reconfigure ShurjoPay before making payment
    if (!configureShurjoPay()) {
      console.error(`❌ [PAYMENT] ShurjoPay not properly configured - missing credentials`);
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured. Please set SP_USERNAME, SP_PASSWORD, and SP_PREFIX environment variables.",
        error: "Missing ShurjoPay credentials"
      });
    }

    // Make payment request - wrap in Promise to handle async properly
    console.log(`🔄 [PAYMENT] Initiating payment with ShurjoPay...`);
    console.log(`🔗 [PAYMENT] ShurjoPay Endpoint: ${SP_ENDPOINT}`);
    
    let responseSent = false;
    
    await new Promise((resolve, reject) => {
      sp.makePayment(
        payload,
        async (response_data) => {
          try {
            if (responseSent) {
              console.warn(`⚠️ [PAYMENT] Response already sent, skipping...`);
              return;
            }

            console.log(`📥 [PAYMENT] ShurjoPay response received:`, {
              order_id: response_data.order_id,
              checkout_url: response_data.checkout_url || response_data.payment_url || response_data.GatewayPageURL,
              status: response_data.sp_code || response_data.status
            });

            const gatewayUrl = response_data.checkout_url || response_data.payment_url || response_data.GatewayPageURL;
            
            if (!gatewayUrl) {
              console.error(`❌ [PAYMENT] No gateway URL in response:`, response_data);
              throw new Error("No payment URL received from ShurjoPay");
            }

            // Update payment session with gateway URL
            console.log(`💾 [PAYMENT] Updating payment session with gateway URL...`);
            await PaymentSession.findOneAndUpdate(
              { transactionId: order_id },
              { 
                gatewayPageURL: gatewayUrl,
                paymentSessionData: { ...payload, ...response_data }
              }
            );
            console.log(`✅ [PAYMENT] Payment session updated with gateway URL`);

            console.log(`✅ [PAYMENT] Payment initiated successfully - Gateway URL: ${gatewayUrl}`);
            console.log("=".repeat(60));
            
            responseSent = true;
            res.status(200).json({
              success: true,
              message: "Payment session created",
              data: {
                paymentUrl: gatewayUrl,
                orderId: order_id,
                spOrderId: response_data.order_id,
                planDetails: {
                  name: plan.name,
                  price: plan.price,
                  duration: plan.duration
                }
              }
            });
            resolve();
          } catch (updateError) {
            console.error(`❌ [PAYMENT] Error updating payment session:`, updateError);
            if (!responseSent) {
              responseSent = true;
              res.status(500).json({
                success: false,
                message: "Failed to process payment response",
                error: updateError.message
              });
            }
            reject(updateError);
          }
        },
        (error) => {
          if (responseSent) {
            console.warn(`⚠️ [PAYMENT] Response already sent, skipping error response...`);
            return;
          }

          console.error("=".repeat(60));
          console.error(`❌ [PAYMENT] ShurjoPay payment initiation failed`);
          console.error(`❌ [PAYMENT] Error:`, error.message);
          console.error(`❌ [PAYMENT] Stack:`, error.stack);
          console.error("=".repeat(60));
          
          sp.log(`${error.message} credential`, "error");
          
          // Update payment session status to FAILED
          PaymentSession.findOneAndUpdate(
            { transactionId: order_id },
            { status: 'FAILED' }
          ).catch(err => {
            console.error(`❌ [PAYMENT] Failed to update session status:`, err);
          });
          
          responseSent = true;
          res.status(400).json({
            success: false,
            message: "Failed to initiate payment",
            error: error.message
          });
          reject(error);
        }
      );
    });

  } catch (error) {
    console.error("=".repeat(60));
    console.error(`❌ [PAYMENT] Payment initiation error (catch block):`, error.message);
    console.error(`❌ [PAYMENT] Stack trace:`, error.stack);
    console.error("=".repeat(60));
    
    // Only send response if it hasn't been sent already
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to initiate payment",
        error: error.message
      });
    } else {
      console.warn(`⚠️ [PAYMENT] Response already sent, cannot send error response`);
    }
  }
};
 

// Payment success handler - called after payment completion
 export const paymentSuccess = async (req, res) => {
  console.log("=".repeat(60));
  console.log("✅ [PAYMENT SUCCESS] Payment success callback received");
  console.log("=".repeat(60));
  
  try {
    // ShurjoPay sends order_id as query parameter or in body
    const sp_order_id = req.query.order_id || req.query.sp_order_id || req.body.order_id;
    console.log(`🆔 [PAYMENT SUCCESS] Order ID from request: ${sp_order_id}`);
    console.log(`📋 [PAYMENT SUCCESS] Query params:`, req.query);
    console.log(`📋 [PAYMENT SUCCESS] Body:`, req.body);
    
    if (!sp_order_id) {
      console.error(`❌ [PAYMENT SUCCESS] Missing order ID in request`);
      return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=missing_order_id`);
    }

    console.log(`🔄 [PAYMENT SUCCESS] Verifying payment with ShurjoPay for order: ${sp_order_id}`);
    
    // Verify payment with ShurjoPay
    sp.verifyPayment(
      sp_order_id,
      async (response_data) => {
        try {
          // Log full response to debug
          console.log(`📥 [PAYMENT SUCCESS] Full ShurjoPay verification response:`, JSON.stringify(response_data, null, 2));
          
          // Handle array response (ShurjoPay returns array)
          let paymentData = response_data;
          if (Array.isArray(response_data) && response_data.length > 0) {
            paymentData = response_data[0];
            console.log(`📦 [PAYMENT SUCCESS] Response is array, using first element`);
          }
          
          // If response is still empty/undefined, try to use order_id from request
          if (!paymentData || (!paymentData.order_id && !paymentData.sp_code)) {
            console.warn(`⚠️ [PAYMENT SUCCESS] Verification response is empty or invalid, using order_id from request`);
            console.log(`📋 [PAYMENT SUCCESS] Attempting to process with order_id: ${sp_order_id}`);
            
            // Try to find payment session and process anyway
            const paymentSession = await PaymentSession.findOne({ 
              transactionId: sp_order_id 
            });

            if (paymentSession) {
              console.log(`✅ [PAYMENT SUCCESS] Found payment session, processing payment...`);
              // Process payment with session data
              const userId = paymentSession.userId;
              const planId = paymentSession.planId;
              const plan = await SubscriptionPlan.findById(planId);
              
              if (plan) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + plan.duration);

                await User.findByIdAndUpdate(
                  userId,
                  {
                    subscription: {
                      plan: plan.name,
                      startDate,
                      endDate,
                      transactionId: sp_order_id,
                      validationId: sp_order_id,
                      amount: paymentSession.amount,
                      status: 'active',
                    }
                  },
                  { new: true }
                );

                await Transaction.create({
                  userId,
                  planId,
                  planName: plan.name,
                  amount: paymentSession.amount,
                  transactionId: sp_order_id,
                  validationId: sp_order_id,
                  paymentMethod: 'ShurjoPay',
                  startDate,
                  expiryDate: endDate,
                  paymentDetails: {
                    spOrderId: sp_order_id,
                    spCode: '1000',
                    spMessage: 'Payment verified',
                    transactionStatus: 'Completed'
                  }
                });

                await PaymentSession.findOneAndUpdate(
                  { transactionId: sp_order_id },
                  { status: 'COMPLETED' }
                );

                console.log(`✅ [PAYMENT SUCCESS] Payment processed successfully with order_id: ${sp_order_id}`);
                return res.redirect(`${process.env.CLIENT_URL}/payment/success?transactionId=${sp_order_id}`);
              }
            }
            
            // If we can't process, redirect to pending status
            console.warn(`⚠️ [PAYMENT SUCCESS] Could not process payment, redirecting to pending status`);
            return res.redirect(`${process.env.CLIENT_URL}/payment/success?order_id=${sp_order_id}&status=pending`);
          }

          console.log(`📥 [PAYMENT SUCCESS] ShurjoPay verification response:`, {
            order_id: paymentData.order_id,
            sp_code: paymentData.sp_code,
            transaction_status: paymentData.transaction_status,
            amount: paymentData.amount || paymentData.payable_amount,
            customer_order_id: paymentData.customer_order_id
          });

          // Check if payment was successful
          if (paymentData.sp_code !== '1000' && paymentData.sp_code !== 1000) {
            console.error(`❌ [PAYMENT SUCCESS] Payment not successful - SP Code: ${paymentData.sp_code}, Message: ${paymentData.sp_message || paymentData.sp_massage}`);
            return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=payment_failed&code=${paymentData.sp_code || 'unknown'}`);
          }

          console.log(`✅ [PAYMENT SUCCESS] Payment verified successfully`);

          // Extract user and plan info from stored payment session
          const customerOrderId = paymentData.customer_order_id || sp_order_id;
          console.log(`🔍 [PAYMENT SUCCESS] Looking for payment session with transaction ID: ${customerOrderId}`);
          
          const paymentSession = await PaymentSession.findOne({ 
            transactionId: customerOrderId 
          });

          if (!paymentSession) {
            console.error(`❌ [PAYMENT SUCCESS] Payment session not found for order: ${customerOrderId}`);
            return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=session_not_found`);
          }
          console.log(`✅ [PAYMENT SUCCESS] Payment session found - Session ID: ${paymentSession._id}`);

          // Check if transaction already processed
          const transactionId = paymentData.order_id || sp_order_id;
          console.log(`🔍 [PAYMENT SUCCESS] Checking for existing transaction: ${transactionId}`);
          
          const existingTransaction = await Transaction.findOne({ 
            transactionId: transactionId
          });

          if (existingTransaction) {
            console.log(`⚠️ [PAYMENT SUCCESS] Transaction already processed - redirecting to success page`);
            return res.redirect(`${process.env.CLIENT_URL}/payment/success?transactionId=${transactionId}`);
          }

          const userId = paymentSession.userId;
          const planId = paymentSession.planId;
          console.log(`👤 [PAYMENT SUCCESS] Processing for User ID: ${userId}, Plan ID: ${planId}`);

          const plan = await SubscriptionPlan.findById(planId);
          if (!plan) {
            console.error(`❌ [PAYMENT SUCCESS] Plan not found: ${planId}`);
            return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=plan_not_found`);
          }
          console.log(`✅ [PAYMENT SUCCESS] Plan found: ${plan.name}`);

          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + plan.duration);
          console.log(`📅 [PAYMENT SUCCESS] Subscription period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

          // Update user subscription
          console.log(`💾 [PAYMENT SUCCESS] Updating user subscription...`);
          await User.findByIdAndUpdate(
            userId,
            {
              subscription: {
                plan: plan.name,
                startDate,
                endDate,
                transactionId: transactionId,
                validationId: transactionId,
                amount: parseFloat(paymentData.amount || paymentData.payable_amount || paymentSession.amount),
                status: 'active',
              }
            },
            { new: true }
          );
          console.log(`✅ [PAYMENT SUCCESS] User subscription updated successfully`);

          // Create transaction record
          console.log(`💾 [PAYMENT SUCCESS] Creating transaction record...`);
          const transaction = await Transaction.create({
            userId,
            planId,
            planName: plan.name,
            amount: parseFloat(paymentData.amount || paymentData.payable_amount || paymentSession.amount),
            transactionId: transactionId,
            validationId: transactionId,
            paymentMethod: paymentData.method || 'ShurjoPay',
            startDate,
            expiryDate: endDate,
            paymentDetails: {
              spOrderId: paymentData.order_id || transactionId,
              spCode: paymentData.sp_code || '1000',
              spMessage: paymentData.sp_message || paymentData.sp_massage || 'Payment verified',
              method: paymentData.method,
              bankTrxId: paymentData.bank_trx_id,
              invoiceNo: paymentData.invoice_no,
              transactionStatus: paymentData.transaction_status || 'Completed',
              customerName: paymentData.name,
              customerEmail: paymentData.email,
              customerAddress: paymentData.address,
              customerCity: paymentData.city
            }
          });
          console.log(`✅ [PAYMENT SUCCESS] Transaction record created - Transaction ID: ${transaction._id}`);

          // Update payment session status
          console.log(`💾 [PAYMENT SUCCESS] Updating payment session status to COMPLETED...`);
          await PaymentSession.findOneAndUpdate(
            { transactionId: customerOrderId },
            { status: 'COMPLETED' }
          );
          console.log(`✅ [PAYMENT SUCCESS] Payment session status updated`);

          console.log(`✅ [PAYMENT SUCCESS] Payment processing completed successfully`);
          console.log("=".repeat(60));
          
          return res.redirect(`${process.env.CLIENT_URL}/payment/success?transactionId=${transactionId}`);

        } catch (error) {
          console.error("=".repeat(60));
          console.error(`❌ [PAYMENT SUCCESS] Transaction processing error:`, error.message);
          console.error(`❌ [PAYMENT SUCCESS] Stack trace:`, error.stack);
          console.error("=".repeat(60));
          return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=transaction_save_error`);
        }
      },
      (error) => {
        console.error("=".repeat(60));
        console.error(`❌ [PAYMENT SUCCESS] Payment verification error:`, error.message);
        console.error(`❌ [PAYMENT SUCCESS] Stack trace:`, error.stack);
        console.error("=".repeat(60));
        
        sp.log(error.message, "error");
        return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=verification_failed`);
      }
    );

  } catch (error) {
    console.error("=".repeat(60));
    console.error(`❌ [PAYMENT SUCCESS] Payment Success Handler Error:`, error.message);
    console.error(`❌ [PAYMENT SUCCESS] Stack trace:`, error.stack);
    console.error("=".repeat(60));
    return res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=server_error`);
  }
};

// IPN (Instant Payment Notification) endpoint
export const paymentStatusUpdate = async (req, res) => {
  console.log("=".repeat(60));
  console.log("📢 [IPN] Instant Payment Notification received");
  console.log("=".repeat(60));
  
  try {
    // ShurjoPay sends order_id in query or body
    const sp_order_id = req.query.sp_order_id || req.query.order_id || req.body.order_id;
    console.log(`🆔 [IPN] Order ID from request: ${sp_order_id}`);
    console.log(`📋 [IPN] Query params:`, req.query);
    console.log(`📋 [IPN] Body:`, req.body);
    
    if (!sp_order_id) {
      console.error(`❌ [IPN] Order ID not provided in request`);
      return res.status(400).json({
        success: false,
        message: "Order ID not provided"
      });
    }

    console.log(`🔄 [IPN] Verifying payment with ShurjoPay for order: ${sp_order_id}`);
    
    // Verify payment with ShurjoPay
    sp.verifyPayment(
      sp_order_id,
      async (response_data) => {
        try {
          // Log full response to debug
          console.log(`📥 [IPN] Full ShurjoPay verification response:`, JSON.stringify(response_data, null, 2));
          
          // Handle array response (ShurjoPay returns array)
          let paymentData = response_data;
          if (Array.isArray(response_data) && response_data.length > 0) {
            paymentData = response_data[0];
            console.log(`📦 [IPN] Response is array, using first element`);
          }
          
          console.log(`📥 [IPN] ShurjoPay verification response:`, {
            order_id: paymentData?.order_id,
            sp_code: paymentData?.sp_code,
            transaction_status: paymentData?.transaction_status,
            amount: paymentData?.amount || paymentData?.payable_amount
          });

          const transactionId = paymentData?.order_id || sp_order_id;
          
          // Find existing transaction
          console.log(`🔍 [IPN] Checking for existing transaction: ${transactionId}`);
          const existingTransaction = await Transaction.findOne({
            transactionId: transactionId
          });

          if (!existingTransaction) {
            console.log(`⚠️ [IPN] Transaction not found, processing new transaction...`);
            
            // If transaction doesn't exist, process it
            const customerOrderId = response_data.customer_order_id || sp_order_id;
            console.log(`🔍 [IPN] Looking for payment session: ${customerOrderId}`);
            
            const paymentSession = await PaymentSession.findOne({
              transactionId: customerOrderId
            });

            if (paymentSession) {
              console.log(`✅ [IPN] Payment session found - Session ID: ${paymentSession._id}`);
              
              const userId = paymentSession.userId;
              const planId = paymentSession.planId;
              console.log(`👤 [IPN] Processing for User ID: ${userId}, Plan ID: ${planId}`);
              
              const plan = await SubscriptionPlan.findById(planId);
              
              // Check payment status - if response_data is empty, assume success if session exists
              const isPaymentSuccess = paymentData && (paymentData.sp_code === '1000' || paymentData.sp_code === 1000);
              const shouldProcess = isPaymentSuccess || (!paymentData || !paymentData.sp_code);
              
              if (plan && shouldProcess) {
                console.log(`✅ [IPN] Payment successful, processing subscription...`);
                
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + plan.duration);
                console.log(`📅 [IPN] Subscription period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

                console.log(`💾 [IPN] Updating user subscription...`);
                await User.findByIdAndUpdate(
                  userId,
                  {
                    subscription: {
                      plan: plan.name,
                      startDate,
                      endDate,
                      transactionId: transactionId,
                      validationId: transactionId,
                      amount: parseFloat(response_data.amount || response_data.payable_amount),
                      status: 'active',
                    }
                  },
                  { new: true }
                );
                console.log(`✅ [IPN] User subscription updated`);

                console.log(`💾 [IPN] Creating transaction record...`);
                await Transaction.create({
                  userId,
                  planId,
                  planName: plan.name,
                  amount: parseFloat(paymentData?.amount || paymentData?.payable_amount || paymentSession.amount),
                  transactionId: transactionId,
                  validationId: transactionId,
                  paymentMethod: paymentData?.method || 'ShurjoPay',
                  startDate,
                  expiryDate: endDate,
                  paymentDetails: {
                    spOrderId: paymentData?.order_id || sp_order_id,
                    spCode: paymentData?.sp_code || '1000',
                    spMessage: paymentData?.sp_message || paymentData?.sp_massage || 'Payment verified',
                    method: paymentData?.method,
                    transactionStatus: paymentData?.transaction_status || 'Completed'
                  }
                });
                console.log(`✅ [IPN] Transaction record created`);

                console.log(`💾 [IPN] Updating payment session status to COMPLETED...`);
                await PaymentSession.findOneAndUpdate(
                  { transactionId: customerOrderId },
                  { status: 'COMPLETED' }
                );
                console.log(`✅ [IPN] Payment session status updated`);
              } else {
                console.log(`⚠️ [IPN] Payment not successful or plan not found - SP Code: ${paymentData?.sp_code || 'unknown'}`);
              }
            } else {
              console.error(`❌ [IPN] Payment session not found for order: ${customerOrderId}`);
            }
          } else {
            console.log(`✅ [IPN] Transaction already exists - Transaction ID: ${existingTransaction._id}`);
            
            // Update transaction status if it changed
            const currentStatus = existingTransaction.paymentDetails?.transactionStatus;
            const newStatus = paymentData?.transaction_status;
            
            if (paymentData && currentStatus !== newStatus) {
              console.log(`🔄 [IPN] Transaction status changed: ${currentStatus} → ${newStatus}`);
              console.log(`💾 [IPN] Updating transaction status...`);
              
              await Transaction.findOneAndUpdate(
                { transactionId: transactionId },
                {
                  'paymentDetails.transactionStatus': newStatus,
                  'paymentDetails.spCode': paymentData.sp_code,
                  'paymentDetails.spMessage': paymentData.sp_message || paymentData.sp_massage
                }
              );
              console.log(`✅ [IPN] Transaction status updated`);
            } else {
              console.log(`ℹ️ [IPN] Transaction status unchanged: ${newStatus || currentStatus}`);
            }
          }

          console.log(`✅ [IPN] IPN processing completed successfully`);
          console.log("=".repeat(60));
          
          return res.status(200).json({
            success: true,
            message: "Payment status updated",
            data: paymentData || { order_id: sp_order_id, status: 'processed' }
          });

        } catch (error) {
          console.error("=".repeat(60));
          console.error(`❌ [IPN] IPN processing error:`, error.message);
          console.error(`❌ [IPN] Stack trace:`, error.stack);
          console.error("=".repeat(60));
          
          return res.status(500).json({
            success: false,
            message: "Failed to process IPN",
            error: error.message
          });
        }
      },
      (error) => {
        console.error("=".repeat(60));
        console.error(`❌ [IPN] Payment verification error:`, error.message);
        console.error(`❌ [IPN] Stack trace:`, error.stack);
        console.error("=".repeat(60));
        
        sp.log(error.message, "error");
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
          error: error.message
        });
      }
    );

  } catch (error) {
    console.error("=".repeat(60));
    console.error(`❌ [IPN] IPN Handler Error:`, error.message);
    console.error(`❌ [IPN] Stack trace:`, error.stack);
    console.error("=".repeat(60));
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Verify payment and return transaction (for frontend)
export const verifyPaymentAndGetTransaction = async (req, res) => {
  try {
    const { order_id } = req.query;
    
    console.log(`🔍 [VERIFY PAYMENT] Order ID: ${order_id}`);
    
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    // First, try to find existing transaction
    let transaction = await Transaction.findOne({ 
      $or: [
        { transactionId: order_id },
        { 'paymentDetails.spOrderId': order_id }
      ]
    })
      .populate('userId', 'name phone')
      .populate('planId', 'name price duration');

    // If transaction exists, return it
    if (transaction) {
      console.log(`✅ [VERIFY PAYMENT] Transaction found: ${transaction.transactionId}`);
      return res.status(200).json({
        success: true,
        message: "Transaction found",
        data: transaction
      });
    }

    // If not found, verify with ShurjoPay and process
    console.log(`🔄 [VERIFY PAYMENT] Transaction not found, verifying with ShurjoPay...`);
    
    return new Promise((resolve) => {
      sp.verifyPayment(
        order_id,
        async (response_data) => {
          try {
            // Handle array response
            let paymentData = response_data;
            if (Array.isArray(response_data) && response_data.length > 0) {
              paymentData = response_data[0];
            }

            console.log(`📥 [VERIFY PAYMENT] ShurjoPay response:`, {
              order_id: paymentData?.order_id,
              sp_code: paymentData?.sp_code,
              transaction_status: paymentData?.transaction_status
            });

            // Find payment session
            const paymentSession = await PaymentSession.findOne({
              $or: [
                { transactionId: order_id },
                { transactionId: paymentData?.customer_order_id }
              ]
            });

            if (!paymentSession) {
              console.error(`❌ [VERIFY PAYMENT] Payment session not found`);
              return res.status(404).json({
                success: false,
                message: "Payment session not found"
              });
            }

            // Check if payment was successful
            const isSuccess = paymentData && (paymentData.sp_code === '1000' || paymentData.sp_code === 1000);
            
            if (!isSuccess && paymentData && paymentData.sp_code) {
              console.error(`❌ [VERIFY PAYMENT] Payment not successful - SP Code: ${paymentData.sp_code}`);
              return res.status(400).json({
                success: false,
                message: "Payment not successful",
                sp_code: paymentData.sp_code,
                sp_message: paymentData.sp_message || paymentData.sp_massage
              });
            }

            // Process payment if not already processed
            const userId = paymentSession.userId;
            const planId = paymentSession.planId;
            const plan = await SubscriptionPlan.findById(planId);

            if (!plan) {
              return res.status(404).json({
                success: false,
                message: "Plan not found"
              });
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + plan.duration);

            // Update user subscription
            await User.findByIdAndUpdate(
              userId,
              {
                subscription: {
                  plan: plan.name,
                  startDate,
                  endDate,
                  transactionId: paymentData?.order_id || order_id,
                  validationId: paymentData?.order_id || order_id,
                  amount: parseFloat(paymentData?.amount || paymentData?.payable_amount || paymentSession.amount),
                  status: 'active',
                }
              },
              { new: true }
            );

            // Create transaction
            const newTransaction = await Transaction.create({
              userId,
              planId,
              planName: plan.name,
              amount: parseFloat(paymentData?.amount || paymentData?.payable_amount || paymentSession.amount),
              transactionId: paymentData?.order_id || order_id,
              validationId: paymentData?.order_id || order_id,
              paymentMethod: paymentData?.method || 'ShurjoPay',
              startDate,
              expiryDate: endDate,
              paymentDetails: {
                spOrderId: paymentData?.order_id || order_id,
                spCode: paymentData?.sp_code || '1000',
                spMessage: paymentData?.sp_message || paymentData?.sp_massage || 'Payment verified',
                method: paymentData?.method,
                bankTrxId: paymentData?.bank_trx_id,
                invoiceNo: paymentData?.invoice_no,
                transactionStatus: paymentData?.transaction_status || 'Completed',
                customerName: paymentData?.name,
                customerEmail: paymentData?.email,
                customerAddress: paymentData?.address,
                customerCity: paymentData?.city
              }
            });

            // Update payment session
            await PaymentSession.findOneAndUpdate(
              { _id: paymentSession._id },
              { status: 'COMPLETED' }
            );

            // Fetch the created transaction with populated fields
            const createdTransaction = await Transaction.findById(newTransaction._id)
              .populate('userId', 'name phone')
              .populate('planId', 'name price duration');

            console.log(`✅ [VERIFY PAYMENT] Payment processed successfully`);
            
            return res.status(200).json({
              success: true,
              message: "Payment verified and transaction created",
              data: createdTransaction
            });

          } catch (error) {
            console.error(`❌ [VERIFY PAYMENT] Error processing payment:`, error);
            return res.status(500).json({
              success: false,
              message: "Failed to process payment",
              error: error.message
            });
          }
        },
        (error) => {
          console.error(`❌ [VERIFY PAYMENT] Verification error:`, error);
          return res.status(400).json({
            success: false,
            message: "Payment verification failed",
            error: error.message
          });
        }
      );
    });

  } catch (error) {
    console.error(`❌ [VERIFY PAYMENT] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;

    console.log(`🔍 [GET TRANSACTION] Transaction ID: ${transactionId}`);

    // Search by transactionId or ShurjoPay order_id
    const transaction = await Transaction.findOne({ 
      $or: [
        { transactionId: transactionId },
        { 'paymentDetails.spOrderId': transactionId }
      ]
    })
      .populate('userId', 'name phone')
      .populate('planId', 'name price duration');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction fetched successfully",
      data: transaction
    });

  } catch (error) {
    console.error("Get transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction"
    });
  }
};
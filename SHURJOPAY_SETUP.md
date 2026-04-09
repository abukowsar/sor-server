# ShurjoPay Integration Setup Guide

## ✅ Integration Complete

The payment provider has been successfully changed from SSLCommerz to ShurjoPay. All payment-related functions have been updated.

## 🔧 Required Environment Variables

Add the following environment variables to your `.env` file:

```env
# ShurjoPay Configuration
SP_ENDPOINT=https://sandbox.shurjopayment.com  # Use https://engine.shurjopayment.com for production
SP_USERNAME=sp_sandbox  # Your ShurjoPay username (use production credentials for live)
SP_PASSWORD=pyyk97hu&6u6  # Your ShurjoPay password (use production credentials for live)
SP_PREFIX=SOR  # Transaction prefix (provided by ShurjoPay, e.g., NOK, SOR, etc.)
SP_RETURN_URL=http://your-server-url/api/plan/success-payment  # URL to redirect after payment
SP_CANCEL_URL=http://your-client-url/payment/cancel  # URL to redirect if payment is cancelled
```

### Sandbox Credentials (for testing):

- **Username**: `sp_sandbox`
- **Password**: `pyyk97hu&6u6`
- **Prefix**: `NOK` (or any prefix you prefer)
- **Endpoint**: `https://sandbox.shurjopayment.com`

### Production Credentials:

Contact ShurjoPay to get your production credentials. They will provide:

- Production username and password
- Your unique transaction prefix
- Production endpoint URL

## 📝 Changes Made

### 1. **Controller Updates** (`controllers/subscriptionPlanController.js`)

- Replaced SSLCommerz with ShurjoPay
- Updated `createSslPayment` → `createShurjoPayment`
- Updated `paymentSuccess` to use ShurjoPay verification
- Added `paymentStatusUpdate` for IPN (Instant Payment Notification)

### 2. **Route Updates** (`routes/subscriptionPlanRoutes.js`)

- Changed route from `/create-ssl-payment` → `/create-payment`
- Added IPN endpoint: `/payment-status-update`
- Kept success payment route: `/success-payment`

### 3. **Package Installation**

- Installed `shurjopay` npm package (v0.12.1)
- SSLCommerz package can be removed if no longer needed

## 🔄 Payment Flow

1. **Initiate Payment**:

   - POST `/api/plan/create-payment` (requires authentication)
   - Returns `paymentUrl` to redirect user

2. **Payment Success**:

   - User is redirected to `/api/plan/success-payment`
   - Payment is verified with ShurjoPay
   - User subscription is updated
   - Transaction is saved to database

3. **IPN (Instant Payment Notification)**:
   - ShurjoPay calls `/api/plan/payment-status-update`
   - Updates payment status if transaction was pending

## 🧪 Testing

1. Use sandbox credentials in `.env` file
2. Test payment flow with sandbox test cards
3. Verify payment success and failure scenarios
4. Check IPN endpoint is receiving callbacks

## 📚 API Endpoints

### Create Payment

```
POST /api/plan/create-payment
Headers: Authorization: Bearer <token>
Body: { "planId": "<plan_id>" }
Response: { "success": true, "data": { "paymentUrl": "...", "orderId": "..." } }
```

### Payment Success (Callback)

```
POST /api/plan/success-payment?order_id=<sp_order_id>
Redirects to: CLIENT_URL/payment/success?transactionId=...
```

### IPN Endpoint

```
POST /api/plan/payment-status-update?sp_order_id=<order_id>
Called by ShurjoPay server automatically
```

## ⚠️ Important Notes

1. **Remove SSLCommerz**: You can remove `sslcommerz-lts` from `package.json` if you're not using it elsewhere
2. **Update Frontend**: Update your frontend to use the new endpoint `/api/plan/create-payment` instead of `/api/plan/create-ssl-payment`
3. **Environment Variables**: Make sure all ShurjoPay environment variables are set before testing
4. **Production**: Update environment variables with production credentials before going live

## 🔗 Resources

- [ShurjoPay Documentation](https://shurjopay.com.bd/developers/shurjopay-restapi)
- [ShurjoPay GitHub Examples](https://github.com/shurjopay-plugins/sp-plugin-usage-examples)

## ❓ Need Help?

If you encounter any issues:

1. Check that all environment variables are set correctly
2. Verify ShurjoPay credentials are valid
3. Check server logs for error messages
4. Ensure your server URL is accessible for callbacks

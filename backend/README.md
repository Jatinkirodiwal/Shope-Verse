# Shopverse Backend

Express, MongoDB, Mongoose, JWT auth, cart, orders, admin catalog management, and Excel product import APIs.

## Setup

```bash
npm install
```

Create `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopverse
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
ADMIN_NAME=ShopVerse Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_PHONE=0000000000
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
EMAIL_FROM=ShopVerse <no-reply@example.com>
```

For Gmail, use:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-google-app-password
```

`EMAIL_PASS` must be a Google App Password, not your normal Gmail password.

Start the API:

```bash
npm run dev
```

Run idempotent Mongo migrations manually if needed:

```bash
npm run migrate
```

The server also runs the same migration at startup. Legacy unsupported role values are converted to `customer`, blocked statuses are mirrored to `isBlocked`, and catalog/order compatibility fields are backfilled.

## Roles

Only two roles exist:

```text
admin
customer
```

Public registration always creates `role: "customer"` and ignores submitted role values. Admin accounts are managed manually through `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Auth

Protected routes accept:

```text
Authorization: Bearer <token>
```

or the HTTP-only `token` cookie set by login/register.

### Auth Routes

```http
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
PUT /api/auth/profile
```

Registration creates an unverified customer account and emails a 6-digit OTP. OTP expires in 5 minutes, resend cooldown is 60 seconds, and verification is limited to 5 attempts before resend is required. Login is blocked until `isVerified` is true.

## Admin Customer APIs

```http
GET /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
```

Allowed role updates:

```text
customer
admin
```

Customers can be blocked or unblocked with:

```json
{
  "isBlocked": true
}
```

## Product APIs

Public:

```http
GET /api/products
GET /api/products/:id
```

Admin only:

```http
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
GET /api/products/template
GET /api/products/imports
POST /api/products/upload
```

Product fields include `name`, `description`, `category`, `price`, `stock`, `sku`, `imageUrl`, `status`, `createdBy`, `createdAt`, and `updatedAt`.

### Excel Import

`POST /api/products/upload` accepts multipart form-data with field name `file`.

Supported formats:

```text
.xlsx
.xls
.csv
```

Limits and validation:

```text
Max file size: 10MB
Required columns: Product Name, Price, Stock, SKU
Optional columns: Description, Category, Image URL
Invalid rows are skipped and returned in the error report.
Existing SKUs are updated; new SKUs are created.
Duplicate file imports are rejected by file hash.
```

Response shape:

```json
{
  "success": true,
  "totalRows": 100,
  "imported": 95,
  "updated": 3,
  "failed": 2,
  "errors": []
}
```

`GET /api/products/template` generates and downloads `product-import-template.xlsx` if it does not exist.

## Cart APIs

```http
POST /api/cart/add
GET /api/cart
PUT /api/cart/update/:productId
DELETE /api/cart/remove/:productId
DELETE /api/cart/clear
```

## Order APIs

Customer:

```http
POST /api/orders
GET /api/orders/my-orders
GET /api/orders/:id
```

Admin:

```http
GET /api/orders/admin/all
PUT /api/orders/:id/status
```

Order fields include `customer`, `products`, `totalAmount`, `status`, `paymentStatus`, `shippingAddress`, `createdAt`, and `updatedAt`. Existing `user`, `orderItems`, `totalPrice`, and `orderStatus` fields are still populated for compatibility.

## Security

The API includes JWT authentication, admin role middleware, input validation in controllers, upload MIME/extension checks, 10MB spreadsheet upload limits, basic rate limiting, request sanitization, and centralized error handling.

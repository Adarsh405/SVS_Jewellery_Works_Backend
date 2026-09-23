const express = require('express');

const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// Existing upload middleware
const upload = require('../middleware/uploadMiddleware');

// ============================================================
// ORDERS
// No JWT verification for these APIs
// ============================================================

// GET /api/orders
router.get('/', getOrders);

// GET /api/orders/:id
router.get('/:id', getOrderById);

// POST /api/orders
router.post(
  '/',
  upload.single('image'),
  createOrder
);

// PUT /api/orders/:id
router.put(
  '/:id',
  upload.single('image'),
  updateOrder
);

// PATCH /api/orders/:id/status
router.patch(
  '/:id/status',
  updateOrderStatus
);

// DELETE /api/orders/:id
router.delete(
  '/:id',
  deleteOrder
);

module.exports = router;
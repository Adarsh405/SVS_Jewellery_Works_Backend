const express = require('express')

const router =
  express.Router()

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController')

const upload =
  require('../middleware/uploadMiddleware')

// ============================================================
// GET ALL ORDERS
// GET /api/orders
// ============================================================

router.get(
  '/',
  getOrders
)

// ============================================================
// GET ORDER BY ID
// GET /api/orders/:id
// ============================================================

router.get(
  '/:id',
  getOrderById
)

// ============================================================
// CREATE ORDER
// POST /api/orders
// ============================================================

router.post(
  '/',
  upload.single('image'),
  createOrder
)

// ============================================================
// UPDATE ORDER
// PUT /api/orders/:id
// ============================================================

router.put(
  '/:id',
  upload.single('image'),
  updateOrder
)

// ============================================================
// UPDATE STATUS
// PATCH /api/orders/:id/status
// ============================================================

router.patch(
  '/:id/status',
  updateOrderStatus
)

// ============================================================
// DELETE ORDER
// DELETE /api/orders/:id
// ============================================================

router.delete(
  '/:id',
  deleteOrder
)

module.exports = router
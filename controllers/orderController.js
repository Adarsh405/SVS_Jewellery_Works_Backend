const OrderModel = require('../models/orderModel')

// ============================================================
// HELPERS
// ============================================================

const isEmpty = value => {
  return (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  )
}

const toNumber = value => {
  if (isEmpty(value)) {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : null
}

const validateNonNegative = (
  value,
  field
) => {
  const number = toNumber(value)

  if (number === null) {
    return `${field} must be a valid number`
  }

  if (number < 0) {
    return `${field} cannot be negative`
  }

  return null
}

// ============================================================
// IMAGE HELPER
// IMPORTANT:
// Store PUBLIC relative URL, NOT server filesystem path
// ============================================================

const getUploadedImage = req => {
  if (!req.file) {
    return null
  }

  return `/uploads/orders/${req.file.filename}`
}

// ============================================================
// GOLD ORDER VALIDATION
// KDM / HALLMARK
// ============================================================

const validateGoldOrder = body => {
  const fields = [
    ['net_weight', body.net_weight],
    ['gold_rate', body.gold_rate],
    ['charges', body.charges],
    ['making_cost', body.making_cost],
  ]

  for (const [field, value] of fields) {
    if (isEmpty(value)) {
      return `${field} is required for gold orders`
    }

    const error = validateNonNegative(
      value,
      field
    )

    if (error) {
      return error
    }
  }

  return null
}

// ============================================================
// SILVER ORDER VALIDATION
// ============================================================

const validateSilverOrder = body => {
  const fields = [
    ['weight', body.weight],
    ['silver_rate', body.silver_rate],
    ['making_cost', body.making_cost],
  ]

  for (const [field, value] of fields) {
    if (isEmpty(value)) {
      return `${field} is required for silver orders`
    }

    const error = validateNonNegative(
      value,
      field
    )

    if (error) {
      return error
    }
  }

  return null
}

// ============================================================
// COMMON VALIDATION
// ============================================================

const validateCommonFields = body => {
  if (isEmpty(body.customer_name)) {
    return 'Customer name is required'
  }

  if (isEmpty(body.mobile_number)) {
    return 'Mobile number is required'
  }

  if (isEmpty(body.item_name)) {
    return 'Item name is required'
  }

  if (isEmpty(body.order_date)) {
    return 'Order date is required'
  }

  if (!isEmpty(body.advance_paid)) {
    const error = validateNonNegative(
      body.advance_paid,
      'advance_paid'
    )

    if (error) {
      return error
    }
  }

  return null
}

// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (req, res) => {
  try {
    const body = req.body

    console.log('CREATE ORDER BODY:', body)

    // --------------------------------------------------------
    // COMMON VALIDATION
    // --------------------------------------------------------

    const commonError =
      validateCommonFields(body)

    if (commonError) {
      return res.status(400).json({
        success: false,
        message: commonError,
      })
    }

    // --------------------------------------------------------
    // ORDER TYPE
    // --------------------------------------------------------

    const orderType = String(
      body.order_type || ''
    )
      .trim()
      .toLowerCase()

    const allowedOrderTypes = [
      'kdm',
      'hallmark',
      'silver',
    ]

    if (!allowedOrderTypes.includes(orderType)) {
      return res.status(400).json({
        success: false,
        message:
          'order_type must be kdm, hallmark or silver',
      })
    }

    // --------------------------------------------------------
    // TYPE-SPECIFIC VALIDATION
    // --------------------------------------------------------

    if (
      orderType === 'kdm' ||
      orderType === 'hallmark'
    ) {
      const error =
        validateGoldOrder(body)

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        })
      }
    }

    if (orderType === 'silver') {
      const error =
        validateSilverOrder(body)

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        })
      }
    }

    // --------------------------------------------------------
    // NUMERIC VALUES
    // --------------------------------------------------------

    const netWeight =
      toNumber(body.net_weight)

    const goldRate =
      toNumber(body.gold_rate)

    const charges =
      toNumber(body.charges)

    const weight =
      toNumber(body.weight)

    const silverRate =
      toNumber(body.silver_rate)

    const makingCost =
      toNumber(body.making_cost)

    const advancePaid =
      toNumber(body.advance_paid) || 0

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    const image =
      getUploadedImage(req)

    // --------------------------------------------------------
    // CREATE DATABASE OBJECT
    // IMPORTANT:
    // making_cost: makingCost
    // NOT:
    // making_cost,
    // --------------------------------------------------------

    const order =
      await OrderModel.create({
        order_type: orderType,

        customer_name:
          String(
            body.customer_name
          ).trim(),

        mobile_number:
          String(
            body.mobile_number
          ).trim(),

        image,

        item_name:
          String(
            body.item_name
          ).trim(),

        net_weight:
          netWeight,

        gold_rate:
          goldRate,

        charges:
          charges,

        weight:
          weight,

        silver_rate:
          silverRate,

        making_cost:
          makingCost,

        advance_paid:
          advancePaid,

        order_date:
          body.order_date,

        status:
          'pending',
      })

    return res.status(201).json({
      success: true,
      message:
        'Order created successfully',
      order,
    })
  } catch (error) {
    console.error(
      'CREATE ORDER ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to create order',
      detail:
        process.env.NODE_ENV ===
        'development'
          ? error.stack
          : null,
    })
  }
}

// ============================================================
// GET ALL ORDERS
// ============================================================

const getOrders = async (req, res) => {
  try {
    const filters = {
      search:
        req.query.search || '',

      status:
        req.query.status || '',

      order_type:
        req.query.order_type || '',

      from_date:
        req.query.from_date || '',

      to_date:
        req.query.to_date || '',
    }

    const orders =
      await OrderModel.findAll(
        filters
      )

    return res.json({
      success: true,
      count: orders.length,
      orders,
    })
  } catch (error) {
    console.error(
      'GET ORDERS ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to fetch orders',
    })
  }
}

// ============================================================
// GET ORDER BY ID
// ============================================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const { id } = req.params

    const order =
      await OrderModel.findById(id)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    return res.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error(
      'GET ORDER ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to fetch order',
    })
  }
}

// ============================================================
// UPDATE ORDER
// ============================================================

const updateOrder = async (
  req,
  res
) => {
  try {
    const { id } = req.params
    const body = req.body

    console.log(
      'UPDATE ORDER BODY:',
      body
    )

    // --------------------------------------------------------
    // FIND EXISTING ORDER
    // --------------------------------------------------------

    const existingOrder =
      await OrderModel.findById(id)

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    // --------------------------------------------------------
    // COMMON VALIDATION
    // --------------------------------------------------------

    const commonError =
      validateCommonFields(body)

    if (commonError) {
      return res.status(400).json({
        success: false,
        message: commonError,
      })
    }

    // --------------------------------------------------------
    // ORDER TYPE
    // --------------------------------------------------------

    const orderType = String(
      body.order_type || ''
    )
      .trim()
      .toLowerCase()

    const allowedOrderTypes = [
      'kdm',
      'hallmark',
      'silver',
    ]

    if (!allowedOrderTypes.includes(orderType)) {
      return res.status(400).json({
        success: false,
        message:
          'order_type must be kdm, hallmark or silver',
      })
    }

    // --------------------------------------------------------
    // TYPE VALIDATION
    // --------------------------------------------------------

    if (
      orderType === 'kdm' ||
      orderType === 'hallmark'
    ) {
      const error =
        validateGoldOrder(body)

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        })
      }
    }

    if (orderType === 'silver') {
      const error =
        validateSilverOrder(body)

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        })
      }
    }

    // --------------------------------------------------------
    // NUMBERS
    // --------------------------------------------------------

    const netWeight =
      toNumber(body.net_weight)

    const goldRate =
      toNumber(body.gold_rate)

    const charges =
      toNumber(body.charges)

    const weight =
      toNumber(body.weight)

    const silverRate =
      toNumber(body.silver_rate)

    const makingCost =
      toNumber(body.making_cost)

    const advancePaid =
      toNumber(body.advance_paid) || 0

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    let image =
      existingOrder.image

    if (req.file) {
      image =
        `/uploads/orders/${req.file.filename}`
    }

    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    const order =
      await OrderModel.update(
        id,
        {
          order_type:
            orderType,

          customer_name:
            String(
              body.customer_name
            ).trim(),

          mobile_number:
            String(
              body.mobile_number
            ).trim(),

          image,

          item_name:
            String(
              body.item_name
            ).trim(),

          net_weight:
            netWeight,

          gold_rate:
            goldRate,

          charges:
            charges,

          weight:
            weight,

          silver_rate:
            silverRate,

          making_cost:
            makingCost,

          advance_paid:
            advancePaid,

          order_date:
            body.order_date,
        }
      )

    return res.json({
      success: true,
      message:
        'Order updated successfully',
      order,
    })
  } catch (error) {
    console.error(
      'UPDATE ORDER ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to update order',
    })
  }
}

// ============================================================
// UPDATE STATUS
// ============================================================

const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (isEmpty(status)) {
      return res.status(400).json({
        success: false,
        message:
          'Status is required',
      })
    }

    const order =
      await OrderModel.updateStatus(
        id,
        status
      )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    return res.json({
      success: true,
      message:
        'Order status updated successfully',
      order,
    })
  } catch (error) {
    console.error(
      'UPDATE STATUS ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to update status',
    })
  }
}

// ============================================================
// DELETE ORDER
// ============================================================

const deleteOrder = async (
  req,
  res
) => {
  try {
    const { id } = req.params

    const order =
      await OrderModel.delete(id)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    return res.json({
      success: true,
      message:
        'Order deleted successfully',
      order,
    })
  } catch (error) {
    console.error(
      'DELETE ORDER ERROR:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to delete order',
    })
  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
}
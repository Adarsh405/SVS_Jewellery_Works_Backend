const OrderModel = require('../models/orderModel');

const VALID_ORDER_TYPES = [
  'kdm',
  'hallmark',
  'silver'
];

const VALID_STATUSES = [
  'pending',
  'completed'
];


// ============================================================
// HELPERS
// ============================================================

const isEmpty = value =>
  value === undefined ||
  value === null ||
  String(value).trim() === '';


const toNumber = value => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};


const validateNonNegative = (value, field) => {

  const number = toNumber(value);

  if (number === null) {
    return `${field} must be a valid number`;
  }

  if (number < 0) {
    return `${field} cannot be negative`;
  }

  return null;
};


// ============================================================
// COMMON VALIDATION
// ============================================================

const validateCommonFields = body => {

  if (isEmpty(body.customer_name)) {
    return 'customer_name is required';
  }

  if (isEmpty(body.mobile_number)) {
    return 'mobile_number is required';
  }

  if (isEmpty(body.order_type)) {
    return 'order_type is required';
  }

  if (
    !VALID_ORDER_TYPES.includes(
      String(body.order_type).toLowerCase()
    )
  ) {
    return 'Invalid order_type. Use kdm, hallmark or silver';
  }

  if (isEmpty(body.item_name)) {
    return 'item_name is required';
  }

  if (isEmpty(body.order_date)) {
    return 'order_date is required';
  }

  if (
    body.advance_paid === undefined ||
    body.advance_paid === null ||
    body.advance_paid === ''
  ) {
    return 'advance_paid is required';
  }

  const advanceError =
    validateNonNegative(
      body.advance_paid,
      'advance_paid'
    );

  if (advanceError) {
    return advanceError;
  }

  return null;
};


// ============================================================
// GOLD VALIDATION
// ============================================================

const validateGoldOrder = body => {

  const fields = [
    ['net_weight', body.net_weight],
    ['gold_rate', body.gold_rate],
    ['charges', body.charges],
    ['making_cost', body.making_cost]
  ];

  for (const [field, value] of fields) {

    if (isEmpty(value)) {
      return `${field} is required for KDM/Hallmark orders`;
    }

    const error =
      validateNonNegative(
        value,
        field
      );

    if (error) {
      return error;
    }
  }

  return null;
};


// ============================================================
// SILVER VALIDATION
// ============================================================

const validateSilverOrder = body => {

  const fields = [
    ['weight', body.weight],
    ['silver_rate', body.silver_rate],
    ['making_cost', body.making_cost]
  ];

  for (const [field, value] of fields) {

    if (isEmpty(value)) {
      return `${field} is required for silver orders`;
    }

    const error =
      validateNonNegative(
        value,
        field
      );

    if (error) {
      return error;
    }
  }

  return null;
};


// ============================================================
// IMAGE HELPER
// ============================================================

const getUploadedImage = req => {

  if (!req.file) {
    return null;
  }

  return (
    req.file.path ||
    req.file.location ||
    req.file.filename ||
    null
  );
};


// ============================================================
// CREATE ORDER
// ============================================================

const createOrder = async (req, res) => {

  try {

    const body = req.body;

    // --------------------------------------------------------
    // COMMON VALIDATION
    // --------------------------------------------------------

    const commonError =
      validateCommonFields(body);

    if (commonError) {

      return res.status(400).json({
        success: false,
        message: commonError
      });
    }


    const orderType =
      String(body.order_type)
        .toLowerCase()
        .trim();


    // --------------------------------------------------------
    // TYPE-SPECIFIC VALIDATION
    // --------------------------------------------------------

    let validationError;

    if (
      orderType === 'kdm' ||
      orderType === 'hallmark'
    ) {

      validationError =
        validateGoldOrder(body);

    } else {

      validationError =
        validateSilverOrder(body);
    }


    if (validationError) {

      return res.status(400).json({
        success: false,
        message: validationError
      });
    }


    // --------------------------------------------------------
    // CONVERT VALUES
    // --------------------------------------------------------

    const advancePaid =
      toNumber(body.advance_paid);

    const makingCost =
      toNumber(body.making_cost);


    if (
      advancePaid === null ||
      advancePaid < 0
    ) {

      return res.status(400).json({
        success: false,
        message: 'Invalid advance_paid'
      });
    }


    if (
      makingCost === null ||
      makingCost < 0
    ) {

      return res.status(400).json({
        success: false,
        message: 'Invalid making_cost'
      });
    }


    // --------------------------------------------------------
    // GOLD VALUES
    // --------------------------------------------------------

    let netWeight = null;
    let goldRate = null;
    let charges = null;

    // --------------------------------------------------------
    // SILVER VALUES
    // --------------------------------------------------------

    let weight = null;
    let silverRate = null;


    if (
      orderType === 'kdm' ||
      orderType === 'hallmark'
    ) {

      netWeight =
        toNumber(body.net_weight);

      goldRate =
        toNumber(body.gold_rate);

      charges =
        toNumber(body.charges);


      if (
        netWeight === null ||
        netWeight < 0
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid net_weight'
        });
      }


      if (
        goldRate === null ||
        goldRate < 0
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid gold_rate'
        });
      }


      if (
        charges === null ||
        charges < 0
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid charges'
        });
      }

    } else {

      weight =
        toNumber(body.weight);

      silverRate =
        toNumber(body.silver_rate);


      if (
        weight === null ||
        weight < 0
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid weight'
        });
      }


      if (
        silverRate === null ||
        silverRate < 0
      ) {

        return res.status(400).json({
          success: false,
          message: 'Invalid silver_rate'
        });
      }
    }


    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    const image =
      getUploadedImage(req);


    // --------------------------------------------------------
    // CREATE DATABASE RECORD
    //
    // IMPORTANT:
    // total_value and due_amount are NOT calculated here.
    // They are NOT stored in the database.
    //
    // Frontend will calculate them.
    // --------------------------------------------------------

    const order =
      await OrderModel.create({

        order_type: orderType,

        customer_name:
          String(body.customer_name).trim(),

        mobile_number:
          String(body.mobile_number).trim(),

        image,

        item_name:
          String(body.item_name).trim(),

        net_weight,

        gold_rate,

        charges,

        weight,

        silver_rate,

        making_cost,

        advance_paid: advancePaid,

        order_date:
          body.order_date,

        status: 'pending'
      });


    return res.status(201).json({

      success: true,

      message:
        'Order created successfully',

      order
    });

  } catch (error) {

    console.error(
      'CREATE ORDER ERROR:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to create order'
    });
  }
};


// ============================================================
// GET ALL ORDERS
// ============================================================

const getOrders = async (req, res) => {

  try {

    const {
      search,
      status,
      order_type,
      from_date,
      to_date
    } = req.query;


    // --------------------------------------------------------
    // STATUS VALIDATION
    // --------------------------------------------------------

    if (
      status &&
      !VALID_STATUSES.includes(
        String(status).toLowerCase()
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid status. Use pending or completed'
      });
    }


    // --------------------------------------------------------
    // ORDER TYPE VALIDATION
    // --------------------------------------------------------

    if (
      order_type &&
      !VALID_ORDER_TYPES.includes(
        String(order_type).toLowerCase()
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid order_type. Use kdm, hallmark or silver'
      });
    }


    // --------------------------------------------------------
    // FETCH
    // --------------------------------------------------------

    const orders =
      await OrderModel.findAll({

        search:
          search?.trim(),

        status:
          status?.toLowerCase(),

        order_type:
          order_type?.toLowerCase(),

        from_date,

        to_date
      });


    return res.status(200).json({

      success: true,

      count: orders.length,

      orders
    });

  } catch (error) {

    console.error(
      'GET ORDERS ERROR:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch orders'
    });
  }
};


// ============================================================
// GET SINGLE ORDER
// ============================================================

const getOrderById = async (req, res) => {

  try {

    const {id} = req.params;


    const order =
      await OrderModel.findById(id);


    if (!order) {

      return res.status(404).json({

        success: false,

        message:
          'Order not found'
      });
    }


    return res.status(200).json({

      success: true,

      order
    });

  } catch (error) {

    console.error(
      'GET ORDER ERROR:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch order'
    });
  }
};


// ============================================================
// UPDATE ORDER
// ============================================================

const updateOrder = async (req, res) => {

  try {

    const {id} = req.params;


    // --------------------------------------------------------
    // EXISTING ORDER
    // --------------------------------------------------------

    const existingOrder =
      await OrderModel.findById(id);


    if (!existingOrder) {

      return res.status(404).json({

        success: false,

        message:
          'Order not found'
      });
    }


    const body = req.body;


    // --------------------------------------------------------
    // ORDER TYPE
    // --------------------------------------------------------

    const orderType =
      String(
        body.order_type ??
        existingOrder.order_type
      )
        .toLowerCase()
        .trim();


    if (
      !VALID_ORDER_TYPES.includes(
        orderType
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid order_type'
      });
    }


    // --------------------------------------------------------
    // COMMON FIELDS
    // --------------------------------------------------------

    const customerName =
      body.customer_name ??
      existingOrder.customer_name;

    const mobileNumber =
      body.mobile_number ??
      existingOrder.mobile_number;

    const itemName =
      body.item_name ??
      existingOrder.item_name;

    const orderDate =
      body.order_date ??
      existingOrder.order_date;


    if (isEmpty(customerName)) {

      return res.status(400).json({

        success: false,

        message:
          'customer_name is required'
      });
    }


    if (isEmpty(mobileNumber)) {

      return res.status(400).json({

        success: false,

        message:
          'mobile_number is required'
      });
    }


    if (isEmpty(itemName)) {

      return res.status(400).json({

        success: false,

        message:
          'item_name is required'
      });
    }


    if (isEmpty(orderDate)) {

      return res.status(400).json({

        success: false,

        message:
          'order_date is required'
      });
    }


    // --------------------------------------------------------
    // ADVANCE
    // --------------------------------------------------------

    const advancePaid =
      toNumber(
        body.advance_paid ??
        existingOrder.advance_paid
      );


    if (
      advancePaid === null ||
      advancePaid < 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid advance_paid'
      });
    }


    // --------------------------------------------------------
    // MAKING COST
    // --------------------------------------------------------

    const makingCost =
      toNumber(
        body.making_cost ??
        existingOrder.making_cost
      );


    if (
      makingCost === null ||
      makingCost < 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid making_cost'
      });
    }


    // --------------------------------------------------------
    // GOLD VALUES
    // --------------------------------------------------------

    let netWeight = null;
    let goldRate = null;
    let charges = null;


    // --------------------------------------------------------
    // SILVER VALUES
    // --------------------------------------------------------

    let weight = null;
    let silverRate = null;


    if (
      orderType === 'kdm' ||
      orderType === 'hallmark'
    ) {

      netWeight =
        toNumber(
          body.net_weight ??
          existingOrder.net_weight
        );


      goldRate =
        toNumber(
          body.gold_rate ??
          existingOrder.gold_rate
        );


      charges =
        toNumber(
          body.charges ??
          existingOrder.charges
        );


      if (
        netWeight === null ||
        netWeight < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid net_weight'
        });
      }


      if (
        goldRate === null ||
        goldRate < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid gold_rate'
        });
      }


      if (
        charges === null ||
        charges < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid charges'
        });
      }

    } else {

      weight =
        toNumber(
          body.weight ??
          existingOrder.weight
        );


      silverRate =
        toNumber(
          body.silver_rate ??
          existingOrder.silver_rate
        );


      if (
        weight === null ||
        weight < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid weight'
        });
      }


      if (
        silverRate === null ||
        silverRate < 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Invalid silver_rate'
        });
      }
    }


    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    let image =
      existingOrder.image;

    if (req.file) {

      image =
        req.file.path ||
        req.file.location ||
        req.file.filename ||
        null;
    }


    // --------------------------------------------------------
    // UPDATE DATABASE
    //
    // IMPORTANT:
    // No total_value.
    // No due_amount.
    //
    // They are frontend calculations.
    // --------------------------------------------------------

    const updated =
      await OrderModel.update(
        id,
        {

          order_type:
            orderType,

          customer_name:
            String(customerName).trim(),

          mobile_number:
            String(mobileNumber).trim(),

          image,

          item_name:
            String(itemName).trim(),

          net_weight,

          gold_rate,

          charges,

          weight,

          silver_rate,

          making_cost:
            makingCost,

          advance_paid:
            advancePaid,

          order_date:
            orderDate
        }
      );


    if (!updated) {

      return res.status(404).json({

        success: false,

        message:
          'Order not found'
      });
    }


    return res.status(200).json({

      success: true,

      message:
        'Order updated successfully',

      order:
        updated
    });

  } catch (error) {

    console.error(
      'UPDATE ORDER ERROR:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to update order'
    });
  }
};


// ============================================================
// CHANGE STATUS
// ============================================================

const updateOrderStatus = async (req, res) => {

  try {

    const {id} = req.params;

    const {status} = req.body;


    const normalizedStatus =
      String(status || '')
        .toLowerCase()
        .trim();


    if (
      !VALID_STATUSES.includes(
        normalizedStatus
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid status. Use pending or completed'
      });
    }


    const order =
      await OrderModel.updateStatus(
        id,
        normalizedStatus
      );


    if (!order) {

      return res.status(404).json({

        success: false,

        message:
          'Order not found'
      });
    }


    return res.status(200).json({

      success: true,

      message:
        `Order marked as ${normalizedStatus}`,

      order
    });

  } catch (error) {

    console.error(
      'STATUS UPDATE ERROR:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to update order status'
    });
  }
};


// ============================================================
// DELETE ORDER
// ============================================================

const deleteOrder = async (req, res) => {

  try {

    const {id} = req.params;


    const order =
      await OrderModel.delete(id);


    if (!order) {

      return res.status(404).json({

        success: false,

        message:
          'Order not found'
      });
    }


    return res.status(200).json({

      success: true,

      message:
        'Order deleted successfully',

      order
    });

  } catch (error) {

    console.error(
      'DELETE ORDER ERROR:',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Failed to delete order'
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  createOrder,

  getOrders,

  getOrderById,

  updateOrder,

  updateOrderStatus,

  deleteOrder
};
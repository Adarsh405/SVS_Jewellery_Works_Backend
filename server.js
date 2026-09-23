require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json())

app.use(
  express.urlencoded({
    extended: true,
  })
)

app.use(cookieParser())

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin:
      'https://svs-jewellery-works-frontend.vercel.app',
    credentials: true,
  })
)

// ============================================================
// UPLOADS
// ============================================================

// This makes:
// /uploads/orders/example.jpg
//
// available at:
// https://svs-jewellery-works-backend.onrender.com/uploads/orders/example.jpg

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
)

// ============================================================
// ROUTES
// ============================================================

const authRoutes =
  require('./routes/authRoutes')

const kdmRoutes =
  require('./routes/kdmRoutes')

const hallmarkRoutes =
  require('./routes/hallmarkRoutes')

const silverRoutes =
  require('./routes/silverRoutes')

const rateRoutes =
  require('./routes/rateRoutes')

const soldItemRoutes =
  require('./routes/soldItemRoutes')

const orderRoutes =
  require('./routes/orderRoutes')

// ============================================================
// API ROUTES
// ============================================================

app.use(
  '/api/auth',
  authRoutes
)

app.use(
  '/api/kdm',
  kdmRoutes
)

app.use(
  '/api/hallmark',
  hallmarkRoutes
)

app.use(
  '/api/silver',
  silverRoutes
)

app.use(
  '/api/rates',
  rateRoutes
)

app.use(
  '/api/sold-items',
  soldItemRoutes
)

app.use(
  '/api/orders',
  orderRoutes
)

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  '/',
  (req, res) => {
    res.json({
      success: true,
      message:
        'Jewellery Shop API is running',
    })
  }
)

// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        'API endpoint not found',
    })
  }
)

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      'GLOBAL ERROR:',
      error
    )

    // Multer file-size error
    if (
      error.code ===
      'LIMIT_FILE_SIZE'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Image size cannot exceed 5 MB',
      })
    }

    // Other upload errors
    if (error.message) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }

    return res.status(500).json({
      success: false,
      message:
        'Internal server error',
    })
  }
)

// ============================================================
// START SERVER
// ============================================================

const PORT =
  process.env.PORT || 5000

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Server running on port ${PORT}`
    )
  }
)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();


// Middleware

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000/",
    credentials: true,
  })
);


// Routes

const authRoutes = require("./routes/authRoutes");
const kdmRoutes = require("./routes/kdmRoutes");
const hallmarkRoutes = require("./routes/hallmarkRoutes");
const silverRoutes = require("./routes/silverRoutes");
const rateRoutes = require("./routes/rateRoutes");
const soldItemRoutes = require("./routes/soldItemRoutes");


app.use("/api/auth", authRoutes);

app.use("/api/kdm", kdmRoutes);

app.use("/api/hallmark", hallmarkRoutes);

app.use("/api/silver", silverRoutes);

app.use("/api/rates", rateRoutes);
app.use("/api/sold-items", soldItemRoutes);


// Health check

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Jewellery Shop API is running"
  });
});


// 404

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});


// Start server

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

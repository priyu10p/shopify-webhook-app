const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Shopify credentials
const SHOPIFY_STORE = "organic-luxury-shop.myshopify.com"; // 👉 apna store name
const ADMIN_API_ACCESS_TOKEN = "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"; // 👉 apna token

// Webhook route
app.post("/api/inventory-update", async (req, res) => {
  console.log("✅ Webhook received:", req.body);

  res.send("ok");
});

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Shopify Webhook App is running!");
});

// Export app for Vercel
module.exports = app;

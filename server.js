const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Shopify credentials
const SHOPIFY_STORE = "organic-luxury-shop.myshopify.com"; // 👉 apna store name
const ADMIN_API_ACCESS_TOKEN = "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"; // 👉 apna token

// Function to update metafield
const updateMetafield = async (productId) => {
  const url = `https://${SHOPIFY_STORE}/admin/api/2025-01/products/${productId}/metafields.json`;

  const metafieldPayload = {
    metafield: {
      namespace: "custom",
      key: "coming_soon_badge",
      value: "coming_soon",
      type: "single_line_text_field"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN
    },
    body: JSON.stringify(metafieldPayload)
  });

  const data = await response.json();
  return data;
};

// Webhook route
app.post("/api/inventory-update", async (req, res) => {
  console.log("✅ Webhook received:", req.body);

  try {
    // Shopify webhook payload me inventory item aur product ID milega
    const inventoryItem = req.body;
    const productId = inventoryItem.product_id; // check karo payload me exact field
    const inventoryQuantity = inventoryItem.available; // quantity check karo

    console.log("Product ID:", productId, "Quantity:", inventoryQuantity);

    if (inventoryQuantity === 0) {
      // Inventory 0 hai, coming soon badge add karo
      const result = await updateMetafield(productId);
      console.log("Metafield updated:", result);
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error");
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Shopify Webhook App is running!");
});

// Export app for Vercel
module.exports = app;

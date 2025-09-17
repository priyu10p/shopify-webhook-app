// server.js
const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// 🔑 Shopify credentials
const SHOPIFY_STORE = "organic-luxury-shop.myshopify.com"; // yaha apna store likho
const ADMIN_API_ACCESS_TOKEN = "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"; // Shopify admin API token

// ✅ Webhook endpoint
app.post("/inventory-update", async (req, res) => {
  try {
    console.log("Webhook received:", req.body);

    const product = req.body;
    const variant = product.variants ? product.variants[0] : null;

    if (!variant) {
      console.log("No variant data found");
      return res.sendStatus(200);
    }

    // Agar inventory 0 se zyada hai
    if (variant.inventory_quantity > 0) {
      console.log("Inventory available, deleting metafield...");

      // 🔎 Metafields fetch karo
      const metafieldsResponse = await fetch(
        `https://${SHOPIFY_STORE}/admin/api/2024-07/products/${product.id}/metafields.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      const metafieldsData = await metafieldsResponse.json();
      console.log("Metafields fetched:", metafieldsData);

      if (metafieldsData.metafields && metafieldsData.metafields.length > 0) {
        for (let mf of metafieldsData.metafields) {
          if (mf.namespace === "custom" && mf.key === "your_metafield_key") {
            // ❌ Delete metafield
            await fetch(
              `https://${SHOPIFY_STORE}/admin/api/2024-07/metafields/${mf.id}.json`,
              {
                method: "DELETE",
                headers: {
                  "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
                  "Content-Type": "application/json",
                },
              }
            );
            console.log("Metafield deleted:", mf.id);
          }
        }
      }
    } else {
      console.log("Inventory not available, skipping metafield delete.");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.sendStatus(500);
  }
});

// ✅ Root test endpoint
app.get("/", (req, res) => {
  res.send("Shopify Webhook App Running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


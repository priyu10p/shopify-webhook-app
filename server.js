// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// -------------- FILL THESE 2 FIELDS --------------
const SHOP = "organicluxury.myshopify.com"; 
const ACCESS_TOKEN = "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"; // Shopify Admin API token
const API_VERSION = "2024-07"; // Shopify API Version
// ---------------------------------------------------
app.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.variants || data.variants.length === 0) {
      console.error('Payload missing data.');
      return res.status(400).send('Bad Request');
    }

    const productId = data.id;
    const newQuantity = data.variants[0].inventory_quantity;

    console.log(`Processing Product ID: ${productId} with quantity: ${newQuantity}`);

    if (newQuantity <= 0) {
      console.log('Quantity is 0. Creating "coming_soon" metafield...');
      
      const payload = {
        metafield: {
          namespace: "custom",
          key: "coming_soon_badge",
          value: "true",
          type: "string"
        }
      };

      await fetch(`https://${SHOP}/admin/api/${API_VERSION}/products/${productId}/metafields.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log(`✅ "coming_soon" metafield added.`);
      
    } else {
      console.log('Quantity is > 0. Removing "coming_soon" metafield...');
      
      const metafieldsRes = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/products/${productId}/metafields.json`, {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      });
      
      if (!metafieldsRes.ok) {
        console.error(`Failed to fetch metafields. Status: ${metafieldsRes.status}`);
        return res.status(500).send('Error fetching metafields.');
      }

      const metafieldsData = await metafieldsRes.json();
      console.log('Received Metafields:', metafieldsData);

      // 2. "coming_soon_badge" metafield find करें
      const badgeMetafield = metafieldsData.metafields.find(m => m.key === 'coming_soon_badge' && m.namespace === 'custom');

      if (badgeMetafield) {

        const deleteRes = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/products/${productId}/metafields/${badgeMetafield.id}.json`, {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json'
          }
        });

        if (deleteRes.ok) {
          console.log(`✅ "coming_soon" metafield removed.`);
        } else {
          console.error(`❌ Failed to remove metafield. Status: ${deleteRes.status}`);
        }
      } else {
        console.log(`"coming_soon_badge" metafield already removed or not found.`);
      }
    }

    res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Server starts on a dynamic port for Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

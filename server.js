// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// -------------- FILL THESE 2 FIELDS --------------
const SHOP = "organicluxury.de"; // Aapke Shopify store ka domain
const ACCESS_TOKEN = "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"; // Shopify Admin API token
const API_VERSION = "2024-07"; // Shopify API Version
// ---------------------------------------------------

app.post('/product-update', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.variants || data.variants.length === 0) {
      console.error('Payload missing data.');
      return res.status(400).send('Bad Request');
    }

    const productId = data.id;
    const newQuantity = data.variants[0].inventory_quantity;

    console.log(`Processing Product ID: ${productId} with quantity: ${newQuantity}`);

    // Agar inventory 0 hai, to "Coming Soon" metafield add karein
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
      
    // Agar inventory 0 se zyada hai, to metafield ko hatayein
    } else {
      console.log('Quantity is > 0. Removing "coming_soon" metafield...');
      
      // 1. Existing metafields dhoondhein
      // Check Shopify's response
const metafieldsRes = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/products/${productId}/metafields.json`, {
    headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }
});
console.log('API Response Status:', metafieldsRes.status);
const metafieldsData = await metafieldsRes.json();
console.log('Received Metafields:', metafieldsData); // Isse aapko pata chalega ki Shopify ne kya bheja hai
//...
      
      // 2. "coming_soon_badge" metafield find karein
      const badgeMetafield = metafieldsData.metafields.find(m => m.key === 'coming_soon_badge' && m.namespace === 'custom');

      if (badgeMetafield) {
        // 3. Agar mil gaya to delete karein
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

// Server starts on port 3000
const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

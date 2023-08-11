const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;

// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 10 * 1000,  //10 sec
  max: 6,  // max requests
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

app.use('/api/search-mac/:mac', limiter);

app.get('/api/search-mac/:mac', async (req, res) => {
    const mac = req.params.mac.toUpperCase().replace(/:/g, ''); 
    const url = `https://standards-oui.ieee.org/oui.txt`;

    try {
        const response = await axios.get(url);
        const lines = response.data.split('\n');
        const vendorInfo = extractVendorInfo(lines, mac);

        if (vendorInfo) {
            res.json(vendorInfo);
        } else {
            res.json({ error: 'Vendor information not found for the provided MAC address.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
});

function extractVendorInfo(lines, mac) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(/\s+/);
        
        if (parts.length >= 3 && parts[0].toUpperCase() === mac) {
            const vendor = parts.slice(2).join(' ');
            return { mac, vendor };
        }
    }

    return null;
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const SENDER_EMAIL = "mishrayash930@gmail.com";
const SENDER_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RECEIVER_EMAIL = "yashm6404@gmail.com";
const SMTP_SERVER = "smtp.gmail.com";
const SMTP_PORT = 465; // Port for SSL

async function notifyLassiAvailability(emailId) {
    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_SERVER,
            port: SMTP_PORT,
            secure: true, // true for 465, false for other ports
            auth: {
                user: SENDER_EMAIL,
                pass: SENDER_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"Lassi Availability Notifier" <${SENDER_EMAIL}>`,
            to: emailId,
            subject: "Amul High Protein Rose Lassi Available",
            text: "Dear Yash,\n\nThe Amul High Protein Rose Lassi is now available in your cart.\n\nBest regards,\nLassi Availability Notifier",
            html: "<p>Dear Yash,</p><p>The Amul High Protein Rose Lassi is now available in your cart.</p><p>Best regards,<br>Lassi Availability Notifier</p>",
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!", info.messageId);
    } catch (error) {
        console.error("An error occurred sending email:", error);
    }
}

async function getSessionCookies() {
    console.log("Getting session cookies...");
    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        };

        const response = await axios.get("https://shop.amul.com/", { headers, timeout: 30000 });
        console.log(`Main site status: ${response.status}`);
        return response.headers['set-cookie'];
    } catch (error) {
        console.error("Error getting session cookies:", error.message);
        return null;
    }
}

async function checkLassiAvailabilityWithCookies() {
    console.log("Making API request with cookies...");
    const cookies = {
        '__cf_bm': 'ElJte9xkLebAlPGG5uz9jvp48aedr6fl1npAIMsN2WM-1753882847-1.0.1.1-WTixJ1GyCF.oyjmAoOY4nPe7XkpoSXu13xH0pDVBknQxLrDdsCmbG2KNXcmr3dmmj10OwYOaJy9RzrTyVfdfsSzpJiqoVeKoPaLXcXkA3k8',
        'jsessionid': 's%3A2OXDGhYljTJVH3DBgLnoFm7y.priwPZk9vunr1qNqHUBRHazGMTxvXKVgotthTgsLius'
    };

    const url = "https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&facets=true&facetgroup=default_category_facet&limit=32&total=1&start=0&cdc=1m&substore=66505ff5145c16635e6cc74d";

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ')
    };

    try {
        const response = await axios.get(url, { headers, timeout: 30000 });
        console.log(`Status Code: ${response.status}`);
        console.log(`Response Length: ${JSON.stringify(response.data).length} characters`);

        const cartItems = response.data.data || [];
        const paging = response.data.paging || {};

        console.log(`Items found: ${cartItems.length}`);
        console.log(`Paging info: ${JSON.stringify(paging)}`);

        if (cartItems.length === 0) {
            console.log("No items found in response.");
            return false;
        }

        console.log("\nAll products found:");
        cartItems.forEach((item, i) => {
            const alias = item.alias || 'No alias';
            const available = item.available || 'Unknown';
            const name = item.name || 'No name';
            console.log(`${i + 1}. ${alias} (Available: ${available}) - ${name}`);
        });

        const targetAlias = "amul-high-protein-rose-lassi-200-ml-or-pack-of-30";
        for (const item of cartItems) {
            if (item.alias === targetAlias && item.available === 1) {
                console.log("Amul High Protein Rose Lassi is available!");
                await notifyLassiAvailability(RECEIVER_EMAIL);
                return true;
            }
        }

        console.log("Amul High Protein Rose Lassi is not available or not found.");
        return false;
    } catch (error) {
        console.error("Request error:", error.message);
        return false;
    }
}

async function checkLassiAvailabilityWithSession() {
    console.log("Making API request with session cookies...");
    const sessionCookies = await getSessionCookies();
    if (!sessionCookies) {
        return false;
    }

    const url = "https://shop.amul.com/api/1/entity/ms.products";
    const params = {
        'fields[name]': '1', 'fields[brand]': '1', 'fields[categories]': '1',
        'fields[collections]': '1', 'fields[alias]': '1', 'fields[sku]': '1',
        'fields[price]': '1', 'fields[compare_price]': '1', 'fields[original_price]': '1',
        'fields[images]': '1', 'fields[metafields]': '1', 'fields[discounts]': '1',
        'fields[catalog_only]': '1', 'fields[is_catalog]': '1', 'fields[seller]': '1',
        'fields[available]': '1', 'fields[inventory_quantity]': '1', 'fields[net_quantity]': '1',
        'fields[num_reviews]': '1', 'fields[avg_rating]': '1',
        'fields[inventory_low_stock_quantity]': '1', 'fields[inventory_allow_out_of_stock]': '1',
        'fields[default_variant]': '1', 'fields[variants]': '1', 'fields[lp_seller_ids]': '1',
        'filters[0][field]': 'categories',
        'filters[0][value][0]': 'protein',
        'filters[0][operator]': 'in',
        'filters[0][original]': '1',
        'facets': 'true',
        'facetgroup': 'default_category_facet',
        'limit': '32',
        'total': '1',
        'start': '0',
        'cdc': '1m',
        'substore': '66505ff5145c16635e6cc74d'
    };

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': sessionCookies.join('; ')
    };

    try {
        const response = await axios.get(url, { params, headers, timeout: 30000 });
        console.log(`Status Code: ${response.status}`);
        console.log(`Response Length: ${JSON.stringify(response.data).length} characters`);

        const cartItems = response.data.data || [];
        const paging = response.data.paging || {};

        console.log(`Items found: ${cartItems.length}`);
        console.log(`Paging info: ${JSON.stringify(paging)}`);

        if (cartItems.length === 0) {
            console.log("No items found in response.");
            return false;
        }

        const targetAlias = "amul-high-protein-rose-lassi-200-ml-or-pack-of-30";
        for (const item of cartItems) {
            if (item.alias === targetAlias && item.available === 1) {
                console.log("Amul High Protein Rose Lassi is available!");
                await notifyLassiAvailability(RECEIVER_EMAIL);
                return true;
            }
        }

        console.log("Amul High Protein Rose Lassi is not available or not found.");
        return false;
    } catch (error) {
        console.error("Session request error:", error.message);
        return false;
    }
}

async function checkLassiAvailability() {
    console.log("=== Trying approach 1: Using Postman cookies ===");
    let result = await checkLassiAvailabilityWithCookies();

    if (!result) {
        console.log("\n=== Trying approach 2: Getting fresh session cookies ===");
        result = await checkLassiAvailabilityWithSession();
    }

    return result;
}

(async () => {
    const success = await checkLassiAvailability();
    if (success) {
        console.log("Notification sent successfully.");
    } else {
        console.log("No notification sent.");
    }
})();
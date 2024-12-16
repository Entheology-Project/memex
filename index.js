const http = require('http');
const crypto = require('crypto');
const request = require('request');
const url = require('url');
const port = 3000;

const data = {
    key: "UODXWI3q5XI79pfS5CJL",
    Secret: "gt63AEaNVZwzQo7k95BFaf0yrCWJkw",
};
const base_url = "https://api.autosnipe.ai/sniper-api";

async function callAuthAPI(end_point, body = {}, method) {
    return new Promise((resolve, reject) => {
        const timeStamp_nonce = Date.now().toString();
        body.url = base_url + end_point;
        body.timeStamp_nonce = timeStamp_nonce;

        let payload = getPayload(body);
        let signature = getSignature(payload, data.Secret);

        let headers = {
            'x-autosnipe-apikey': data.key,
            'x-autosnipe-signature': signature,
            'Content-Type': 'application/json'
        };

        let options = {
            url: body.url,
            method: method,
            headers: headers,
            body: JSON.stringify(body)
        };

        request(options, function(error, res, responseBody) {
            if (!error && res.statusCode === 200) {
                resolve(responseBody);
            } else {
                reject(error || responseBody);
            }
        });
    });
}

function getPayload(body) {
    const content = {
        url: body.url,
        timeStamp_nonce: body.timeStamp_nonce,
        body: JSON.stringify(body)
    };
    return Buffer.from(JSON.stringify(content)).toString('base64');
}

function getSignature(payload, apiSecretKey) {
    return crypto.createHmac('sha512', apiSecretKey)
                 .update(payload)
                 .digest('hex');
}

// Create the server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true); // Parse the request URL
    const pathName = parsedUrl.pathname;
    const query = parsedUrl.query;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');

    if (pathName === '/pairs') {
        const type = query.type || '1'; // Default type if not provided
        let body = {};

        try {
            // Call the external API with the dynamic `type` parameter
            let dataToShow = await callAuthAPI(`/token/pairs?type=${type}`, body, "GET");
            res.end(dataToShow); // Send the API response to the browser
        } catch (error) {
            res.end(JSON.stringify({ error: error.toString() }));
        }
    } else {
        // Handle invalid routes
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Invalid route" }));
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

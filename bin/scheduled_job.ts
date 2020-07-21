import * as https from "https";

const options = {
    hostname: process.env.APP_DOMAIN,
    port: process.env.PORT,
    path: '/triggerupdate',
    method: 'POST',
}

const req = https.request(options, res => {});

req.end();
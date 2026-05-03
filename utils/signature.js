const crypto = require("crypto");

const SECRET = "my_secret_key";

function generateSignature(payload) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

module.exports = { generateSignature };
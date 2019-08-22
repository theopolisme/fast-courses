const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  strictSsl: true,
  jwksUri: process.env.AUTH_JWKS,
  cache: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}
 
function decodeAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {}, function(err, decoded) {
      if (err) { return reject(err); }
      resolve(decoded);
    });
  });
}

module.exports = {
  decodeAccessToken
};

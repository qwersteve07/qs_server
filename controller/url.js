const redisService = require("../redis");
const crypto = require("crypto");

const generateUrl = async (ctx) => {
  const body = ctx.request.body;
  const { url } = JSON.parse(body);
  const urlHash = generateFixedLengthHash(url);
  // search the hash, if hash exist, then return the exist value
  const result = await redisService.getData(urlHash);
  if (result !== null) {
    ctx.status = 201;
    ctx.body = { result: urlHash };
  } else {
    await redisService.setData(urlHash, url);
    ctx.status = 201;
    ctx.body = { result: urlHash };
  }
};

const searchHash = async (ctx) => {
  const hash = ctx.request.params.hash;
  const result = await redisService.getData(hash);
  if (result !== null) {
    ctx.body = { result };
  }
};

const generateFixedLengthHash = (url) => {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return hash.substring(0, 10);
};

module.exports = {
  generateUrl,
  searchHash,
};

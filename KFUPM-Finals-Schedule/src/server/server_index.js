const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const cache = new Map();

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  if (cache.has(key)) {
    return res.json(cache.get(key));
  }
  res.sendResponse = res.json;
  res.json = (body) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
};

app.get("/api/schedule", cacheMiddleware, async (req, res) => {
  try {
    const { term_code } = req.query;

    if (!term_code) {
      return res.status(400).send("Missing term_code parameter");
    }

    const response = await axios.get(
      "https://registrar.kfupm.edu.sa/api/final-examination-schedule",
      {
        params: req.query,
      }
    );

    res.json({
      status: response.status,
      data: response.data?.data || [],
    });
  } catch (error) {
    res.status(500).send("Error fetching data");
  }
});

const PORT = 5000;
app.listen(PORT);

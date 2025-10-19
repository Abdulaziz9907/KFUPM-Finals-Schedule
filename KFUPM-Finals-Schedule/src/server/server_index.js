import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();

// --- CONFIGURATION ---
// The port the server will run on.
const PORT = process.env.PORT || 5000;
// How long to keep data in the cache (in milliseconds).
// Default: 4 hours (4 * 60 minutes * 60 seconds * 1000 ms)
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;

// --- IN-MEMORY CACHE ---
// Using a Map is efficient for this purpose.
// We will store objects like: { data: responseBody, timestamp: Date.now() }
const cache = new Map();

app.use(express.json());
app.use(cors());

/**
 * Custom caching middleware.
 * This checks for a valid, non-expired cache entry before proceeding to the route handler.
 * If a cache miss occurs, it wraps the `res.json` function to automatically store the new
 * response in the cache with a timestamp.
 */
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl; // Use the full URL as the cache key
  const cachedEntry = cache.get(key);

  // --- CACHE HIT ---
  // Check if an entry exists and if it's not expired.
  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
    console.log(`[Cache] HIT for ${key}`);
    // If valid, send the cached data immediately.
    return res.json(cachedEntry.data);
  }

  // --- CACHE MISS ---
  // If no entry exists or it's expired...
  console.log(`[Cache] MISS for ${key}`);
  if (cachedEntry) {
    // If it was just expired, remove the old entry.
    cache.delete(key);
  }

  // Monkey-patch `res.json` to intercept the response body for caching.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Create a new cache entry with the response data and current timestamp.
    const newEntry = {
      data: body,
      timestamp: Date.now()
    };
    cache.set(key, newEntry);
    console.log(`[Cache] SET for ${key}. Cache size: ${cache.size}`);
    // Call the original res.json to send the response to the client.
    originalJson(body);
  };

  next();
};

app.get("/api/schedule", cacheMiddleware, async (req, res) => {
  try {
    const { term_code } = req.query;

    if (!term_code) {
      return res.status(400).json({ error: "Missing term_code parameter" });
    }

    // Proxy the request to the official KFUPM API
    const response = await axios.get(
      "https://registrar.kfupm.edu.sa/api/final-examination-schedule",
      { params: { term_code } } // Forward the term_code
    );

    // Send a structured JSON response.
    res.json({
      status: response.status,
      data: response.data?.data || [], // Ensure data is always an array
    });
  } catch (error) {
    console.error("Error fetching data from KFUPM API:", error.message);
    res.status(500).json({ error: "Error fetching schedule data" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

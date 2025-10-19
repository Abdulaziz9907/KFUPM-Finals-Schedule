import express from "express";
import axios from "axios";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"; // --- NEW ---
import dotenv from "dotenv"; // --- NEW ---

dotenv.config(); // --- NEW ---

const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 5000;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const API_KEY = process.env.GEMINI_API_KEY; // --- NEW ---

// --- GEMINI AI SETUP --- (NEW)
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in .env file.");
  console.log("Please create a .env file and add your API key.");
  process.exit(1); // Exit if no key is found
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- IN-MEMORY CACHE ---
const cache = new Map();

app.use(express.json());
app.use(cors());

/**
 * Custom caching middleware (no changes).
 * This will automatically cache our new /api/suggest-term route.
 */
const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cachedEntry = cache.get(key);

  // --- CACHE HIT ---
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    console.log(`[Cache] HIT for ${key}`);
    return res.json(cachedEntry.data);
  }

  // --- CACHE MISS ---
  console.log(`[Cache] MISS for ${key}`);
  if (cachedEntry) {
    cache.delete(key);
  }

  // Monkey-patch `res.json` to intercept the response body for caching.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const newEntry = {
      data: body,
      timestamp: Date.now(),
    };
    cache.set(key, newEntry);
    console.log(`[Cache] SET for ${key}. Cache size: ${cache.size}`);
    originalJson(body);
  };

  next();
};

// --- API ROUTES ---

/**
 * --- NEW AI ROUTE ---
 * Uses cacheMiddleware to avoid repeated AI calls.
 */
app.get("/api/suggest-term", cacheMiddleware, async (req, res) => {
  try {
    console.log("[AI] Calling Gemini API for term suggestion...");
    
    const prompt = `
      What is the current 3-digit academic term code for KFUPM 
      (King Fahd University of Petroleum and Minerals)?
      For example: 231, 232, 233, 241, 242, 243, 251...
      Today's date is ${new Date().toLocaleDateString('en-US')}.
      Only respond with the 3-digit number.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Find the 3-digit number in the AI's response
    const match = text.match(/\b\d{3}\b/);

    if (match) {
      // res.json() will be intercepted by the middleware and cached
      res.json({ term: match[0] });
    } else {
      console.error("[AI] Could not parse 3-digit term from response:", text);
      res.status(500).json({ error: "Could not parse AI response" });
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    res.status(500).json({ error: "Error calling AI service" });
  }
});

/**
 * Existing Schedule Route (no changes).
 * Also uses cacheMiddleware.
 */
app.get("/api/schedule", cacheMiddleware, async (req, res) => {
  try {
    const { term_code } = req.query;

    if (!term_code) {
      return res.status(400).json({ error: "Missing term_code parameter" });
    }

    const response = await axios.get(
      "https://registrar.kfupm.edu.sa/api/final-examination-schedule",
      { params: { term_code } }
    );

    res.json({
      status: response.status,
      data: response.data?.data || [],
    });
  } catch (error) {
    console.error("Error fetching data from KFUPM API:", error.message);
    res.status(500).json({ error: "Error fetching schedule data" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
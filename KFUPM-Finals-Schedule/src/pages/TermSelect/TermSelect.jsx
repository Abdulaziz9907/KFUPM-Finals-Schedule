import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

// --- CONFIGURATION ---
// This URL points to your new local Express backend
const SUGGEST_TERM_URL = "http://localhost:5000/api/suggest-term";

// --- Animated background ---
const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let circles = [];

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createCircles = () => {
      circles = [];
      const count = Math.floor(canvas.width / 50);
      for (let i = 0; i < count; i++) {
        circles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 20 + 5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // This correctly reads the class from the <html> tag
      const isDark = document.documentElement.classList.contains("dark");
      circles.forEach((circle) => {
        circle.x += circle.vx;
        circle.y += circle.vy;

        if (circle.x - circle.radius < 0 || circle.x + circle.radius > canvas.width)
          circle.vx *= -1;
        if (circle.y - circle.radius < 0 || circle.y + circle.radius > canvas.height)
          circle.vy *= -1;

        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${circle.opacity})`
          : `rgba(0, 0, 0, ${circle.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };

    setCanvasSize();
    createCircles();
    animate();
    window.addEventListener("resize", setCanvasSize);
    return () => window.removeEventListener("resize", setCanvasSize);
  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
};

// --- Main TermSelect Component ---
function TermSelect() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // This useEffect is needed for the AnimatedBackground
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleTermChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 3) setTerm(value);
  };

  /**
   * Calls your local Express backend to get the AI suggestion.
   * The backend then calls the Gemini API.
   */
  const handleSuggestTerm = async () => {
    setIsSuggesting(true);
    toast.info("✨ Asking AI for the current term code...", { theme });

    try {
      const response = await fetch(SUGGEST_TERM_URL); // Calls http://localhost:5000/api/suggest-term
      if (!response.ok) {
        // Handle HTTP errors (like 500 from your server)
        const errorData = await response.json().catch(() => ({})); // Try to get JSON error
        console.error("AI suggestion failed:", response.status, errorData.error);
        throw new Error(errorData.error || "AI suggestion failed");
      }
      
      const data = await response.json(); // Expects { term: "251" }
      
      if (data.term) {
        setTerm(data.term);
        toast.success(`✨ Suggested term: ${data.term}`, { theme });
      } else {
        throw new Error("Invalid response structure from AI");
      }

    } catch (error) {
      console.error("Error suggesting term:", error);
      toast.error(`Sorry, the AI assistant couldn't fetch the term. (${error.message})`, { theme });
    } finally {
      setIsSuggesting(false);
    }
  };

  /**
   * Navigates to the schedule view page, passing the termCode.
   * The Schedule-view component will be responsible for fetching data
   * from your backend's /api/schedule endpoint.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    if (term.length === 3) {
      const termCode = "20" + term + "0";

      // Navigate and pass the termCode in state.
      // The Schedule-view component will read this state.
      setTimeout(() => {
        navigate("/Schedule-view", { state: { termCode } });
        setIsLoading(false);
      }, 1000);
    } else {
      toast.error("Term code must be 3 digits (e.g., 231)", {
        position: "top-center",
        theme,
        transition: Flip,
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {/* Main background with smooth transition */}
      <div
        className={`relative min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <AnimatedBackground />

        {/* Theme Toggle with smooth transition */}
        <div className="absolute top-4 right-4 z-10">
          <label
            className={`swap swap-rotate btn btn-ghost transition-colors duration-300 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <input type="checkbox" onChange={toggleTheme} checked={theme === "light"} />
            {/* ☀️ Sun */}
            <svg
              className="swap-on h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Z" />
            </svg>
            {/* 🌙 Moon */}
            <svg
              className="swap-off h-6 w-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z" />
            </svg>
          </label>
        </div>

        {/* Card with smooth transition */}
        <div
          className={`w-full max-w-sm rounded-xl shadow-2xl ring-1 transition-colors duration-300 ${
            theme === "dark"
              ? "bg-gray-800/70 ring-white/10 backdrop-blur-md"
              : "bg-white ring-black/10"
          }`}
        >
          <div className="p-8 text-center">
            {/* Text with smooth transition */}
            <h1
              className={`text-3xl font-bold transition-colors duration-300 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              KFUPM
            </h1>
            <p
              className={`mt-2 text-sm transition-colors duration-300 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Final Examination Schedule
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <div className="relative">
                  {/* Input with smooth transition */}
                  <input
                    type="text"
                    id="termInput"
                    placeholder="e.g., 231"
                    required
                    value={term}
                    onChange={handleTermChange}
                    pattern="\d{3}"
                    className={`peer w-full rounded-lg border bg-transparent px-4 py-3 placeholder-transparent focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors duration-300 ${
                      theme === "dark"
                        ? "border-gray-500/50 text-white"
                        : "border-gray-300/50 text-gray-800"
                    }`}
                  />
                  {/* Label with smooth transition */}
                  <label
                    htmlFor="termInput"
                    className={`absolute -top-7 left-2 text-xs transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:-top-7 peer-focus:text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Enter 3-Digit Term Code
                  </label>
                </div>

                <div className="mt-3 text-center">
                  {/* Suggest Button with smooth transition */}
                  <button
                    type="button"
                    onClick={handleSuggestTerm}
                    disabled={isSuggesting}
                    className={`text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-wait ${
                      theme === "dark"
                        ? "text-purple-400 hover:text-purple-300"
                        : "text-purple-600 hover:text-purple-500"
                    }`}
                  >
                    {isSuggesting ? "Thinking..." : "✨ Suggest Current Term"}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full rounded-lg bg-purple-600 px-5 py-3 text-base font-medium text-white shadow-lg transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-400 ${
                    theme === "dark" ? "focus:ring-offset-gray-900" : "focus:ring-offset-white"
                  }`}
                >
                  {isLoading ? "Loading..." : "View Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default TermSelect;
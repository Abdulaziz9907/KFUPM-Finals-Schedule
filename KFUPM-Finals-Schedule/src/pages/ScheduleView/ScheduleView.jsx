import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

function Schedule() {
  const location = useLocation();
  const { termCode, termURL } = location.state || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const year = useMemo(() => termCode?.slice(0, 4), [termCode]);
  const word = useMemo(() => {
    const termDigit = parseInt(termCode?.charAt(4));
    return termDigit === 1 ? "first" : termDigit === 2 ? "second" : "summer";
  }, [termCode]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!termCode) {
        setError("Invalid term code.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/schedule", {
          params: { term_code: termCode },
        });

        if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (err) {
        setError("Failed to fetch data or invalid data format.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [termCode]);

  if (loading) {
    return (
      <div>
        <h1>Schedule Page</h1>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Schedule Page</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Schedule Page</h1>
      <p>Term Code: {termCode}</p>
      <p>Term URL: {termURL}</p>
      <p>
        {year} {word} term
      </p>

      <table border="1">
        <thead>
          <tr>
            {data.length > 0 &&
              Object.keys(data[0]).map((key) => <th key={key}>{key}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {Object.values(item).map((value, idx) => (
                <td key={idx}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Schedule;

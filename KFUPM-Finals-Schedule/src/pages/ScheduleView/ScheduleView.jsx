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

  function convertTo12HourFormat(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  function formatDateTimeForICS(date, time) {
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    return `${year}${month}${day}T${hours}${minutes}00`;
  }

  function handleAddToCalendar(item) {
    const { id, date, time, building, class: className } = item;

    // Generate ICS file content
    const startDateTime = formatDateTimeForICS(date, time);
    const endDateTime = formatDateTimeForICS(date, "23:59"); // Adjust as needed

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${id}@scheduleapp
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:Class at ${building}, Room ${className}
DESCRIPTION:Scheduled class for term ${termCode}.
LOCATION:${building}, Room ${className}
END:VEVENT
END:VCALENDAR
`.trim();

    // Create a Blob and download the ICS file
    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `event_${id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!termCode) {
        setError("Invalid term code.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          "https://kfupm-finals-schedule.onrender.com/api/schedule",
          {
            params: { term_code: termCode },
          }
        );

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

      <table className="table" border="1">
        <thead id="table_head">
          <tr>
            {data.length > 0 &&
              Object.keys(data[0])
                .filter((key) => key !== "period")
                .map((key) =>
                  key === "time" ? (
                    <th key="time(12h)">time(12h)</th>
                  ) : (
                    <th key={key}>{key}</th>
                  )
                )}
          </tr>
        </thead>
        <tbody id="table_element" className="hover">
          {data.map((item, index) => (
            <tr className="hover" key={index}>
              {Object.entries(item)
                .filter(([key]) => key !== "period")
                .map(([key, value], idx) =>
                  key === "time" ? (
                    <td key={idx}>
                      {convertTo12HourFormat(value)}
                    </td>
                  ) : (
                    <td key={idx}>{value}</td>
                  )
                )}
              <td>
                <div className="form-control">
                  <label className="cursor-pointer label">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-success"
                    />
                  </label>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => handleAddToCalendar(item)}
                >
                  Add to calendar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Schedule;

import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import 'add-to-calendar-button';
import "./ScheduleView.css"

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
  function convertTo24HourFormat(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  function convertDateFormat(date) {
    const [day, month, year] = date.split("-");
    const months = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07",
      Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    return `${year}-${months[month]}-${day}`;
  }


  useEffect(() => {
    const fetchSchedule = async () => {
      if (!termCode) {
        setError("Invalid term code.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("https://kfupm-finals-schedule.onrender.com/api/schedule", {
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

<div className="navbar bg-base-100">
  <div className="navbar-start">
    
  <div className="dropdown">
  <div tabIndex={0} role="button" className="btn m-1">View Added Courses</div>
  <div
    tabIndex={0}
    className="dropdown-content card card-compact bg-primary text-primary-content z-[1] w-64 p-2 shadow">
    <div className="card-body">
      <h3 className="card-title">Working on it!</h3>
      <p>you should see the added courses here soon</p>
    </div>
  </div>
</div>
  
  </div>
  <div className="navbar-center">
    <a className="btn btn-ghost text-xl">Finals Schedule v0.1</a>
  </div>
  <div className="navbar-end">

  <label className="input input-bordered flex items-center gap-2">
  <input type="text" className="grow" placeholder="Search" />
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="h-4 w-4 opacity-70">
    <path
      fillRule="evenodd"
      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
      clipRule="evenodd" />
  </svg>
</label>
   

    <label className="swap swap-rotate">
  {/* this hidden checkbox controls the state */}
  <input type="checkbox" className="theme-controller" value="synthwave" />

  {/* sun icon */}
  <svg
    className="swap-off h-6 w-6 fill-current"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    <path
      d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
  </svg>

  {/* moon icon */}
  <svg
    className="swap-on h-6 w-6 fill-current"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24">
    <path
      d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
  </svg>
</label>

  </div>
</div>


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
          .filter((key) => key !== "period") // Exclude the "period" column
          .map((key) =>
            key === "time" ? (
              <th key="time(12h)">time(12h)</th>
            ) : (
              <th key={key}>{key}</th>
            )
          )}
    </tr>
  </thead>
  <tbody id="table_all_elements" className="hover">
  {data.map((item, index) => (
    <div id="element_cutomize">
    <tr className="hover" id="table_element" key={index}>
      {Object.entries(item)
        .filter(([key]) => key !== "period") // Exclude "period" column
        .map(([key, value], idx) =>
          key === "time" ? (
            <td key={idx}>
              {convertTo12HourFormat(value)} {/* Convert time to 12-hour format */}
            </td>
          ) : (
            <td key={idx}>{value}</td>
          )
        )}
      <td>
        <div className="form-control">
          <label className="cursor-pointer label">
          <input type="checkbox" aria-label="Add" className="btn" />

          </label>
        </div>

<add-to-calendar-button 
  name={`${item.course_number} Final exam`}
  description={`Final exam for ${item.course_title}. Note that the endtime is not available, refer to your intructor for more details`}
  startDate={`${convertDateFormat(item.date)}`}
  startTime={`${convertTo24HourFormat(item.time)}`}
  endTime={`${convertTo24HourFormat(item.time)}`}
  timeZone="Asia/Riyadh"
  location={item.location}
  options="'Apple'"
  trigger="click"
  hideIconButton
  hideIconList
  hideIconModal
  buttonsList
  hideBackground
  hideCheckmark
  lightMode="bodyScheme"
></add-to-calendar-button>

      </td>
    </tr>
    </div>
  ))}
</tbody>

</table>

    </div>
  );
}

export default Schedule;

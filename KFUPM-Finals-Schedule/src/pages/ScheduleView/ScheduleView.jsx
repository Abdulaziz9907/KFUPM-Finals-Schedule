import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import 'add-to-calendar-button';
import "./ScheduleView.css";

function Schedule() {
  const location = useLocation();
  const { termCode, termURL } = location.state || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addedCourses, setAddedCourses] = useState([]);

  // Memoize expensive computations
  const year = useMemo(() => termCode?.slice(0, 4), [termCode]);
  const word = useMemo(() => {
    const termDigit = parseInt(termCode?.charAt(4));
    return termDigit === 1 ? "first" : termDigit === 2 ? "second" : "summer";
  }, [termCode]);

  // Conversion utility functions
  const convertTo12HourFormat = useCallback((time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }, []);
  
  const convertTo24HourFormat = useCallback((time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }, []);

  const convertDateFormat = useCallback((date) => {
    const [day, month, year] = date.split("-");
    const months = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07",
      Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    return `${year}-${months[month]}-${day}`;
  }, []);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
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
  }, [termCode]);

  // Trigger data fetch on component mount
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return data.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Handler for adding/removing courses
  const toggleCourse = useCallback((course) => {
    setAddedCourses(prevCourses => {
      const isCourseAdded = prevCourses.some(c => c.course_number === course.course_number);
      return isCourseAdded 
        ? prevCourses.filter(c => c.course_number !== course.course_number)
        : [...prevCourses, course];
    });
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="schedule-container">
        <h1>Schedule Page</h1>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="schedule-container">
        <h1>Schedule Page</h1>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      {/* Fixed header */}
      <div className="fixed-header">
        <div className="navbar bg-base-100">
          <div className="navbar-start">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn m-1">
                Added Courses ({addedCourses.length})
              </div>
              <div
                tabIndex={0}
                className="dropdown-content card card-compact bg-primary text-primary-content z-[1] w-64 p-2 shadow">
                <div className="card-body">
                  {addedCourses.length > 0 ? (
                    addedCourses.map(course => (
                      <div key={course.course_number} className="mb-2">
                        {course.course_number} - {course.course_title}
                      </div>
                      
                    ))
                  ) : (
                    <p>No courses added yet</p>
                  )}

                  {addedCourses.length > 0 ? (
                                      <button className="btn btn-sm">Export to pdf</button>
                  ) : (
                    <></>
                  )}


                </div>
              </div>
            </div>
          </div>
          <div className="navbar-center">
            <a className="btn btn-ghost text-xl">Finals Schedule v0.2</a>
          </div>
          <div className="navbar-end">
            <label className="input input-bordered flex items-center gap-2">
              <input 
                type="text" 
                className="grow" 
                placeholder="Search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
          </div>
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-bold">Schedule Page</h1>
          <p>Term Code: {termCode}</p>
          <p>Term URL: {termURL}</p>
          <p>
            {year} {word} term
          </p>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="scrollable-table-container overflow-y-auto">  
        <table className="table w-full table-fixed" border="1">
          <thead className="bg-black sticky top-0 z-10">
            <tr>
              {data.length > 0 &&
                Object.keys(data[0])
                  .filter((key) => key !== "period")
                  .map((key) =>
                    key === "time" ? (
                      <th key="time(12h)" className="w-auto">time(12h)</th>
                    ) : (
                      <th key={key} className="w-auto">{key}</th>
                    )
                  )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="table_all_elements" className="hover">
            {filteredData.map((item, index) => (
              <tr 
                id="table_element" 
                key={index} 
                className={`hover:bg-gray-800 ${
                  addedCourses.some(c => c.course_number === item.course_number) 
                  ? 'bg-gray-600' 
                  : ''
                }`}
              >
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
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="checkbox" 
                      checked={addedCourses.some(c => c.course_number === item.course_number)}
                      onChange={() => toggleCourse(item)}
                    />

                    <add-to-calendar-button 
                      name={`${item.course_number} Final exam`}
                      description={`Final exam for ${item.course_title}. Note that the endtime is not available, refer to your instructor for more details`}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Schedule;
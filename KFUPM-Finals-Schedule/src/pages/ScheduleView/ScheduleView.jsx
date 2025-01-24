import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { FixedSizeList } from "react-window";
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

  const year = useMemo(() => termCode?.slice(0, 4), [termCode]);
  const word = useMemo(() => {
    const termDigit = parseInt(termCode?.charAt(4));
    return termDigit === 1 ? "first" : termDigit === 2 ? "second" : "summer";
  }, [termCode]);

  const convertTo12HourFormat = useCallback((time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${String(minutes).padStart(2, "0")} ${period}`;
  }, []);

  const convertDateFormat = useCallback((date) => {
    const [day, month, year] = date.split("-");
    const months = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    return `${year}-${months[month]}-${day}`;
  }, []);

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

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const filteredData = useMemo(() => {
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const toggleCourse = useCallback((course) => {
    setAddedCourses(prevCourses => {
      const isCourseAdded = prevCourses.some(c => c.course_number === course.course_number);
      return isCourseAdded 
        ? prevCourses.filter(c => c.course_number !== course.course_number)
        : [...prevCourses, course];
    });
  }, []);

  const handleSearch = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  if (loading) {
    return (
      <div className="schedule-container">
        <h1>Schedule Page</h1>
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

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
                </div>
              </div>
            </div>
          </div>
          <div className="navbar-center">
            <a className="btn btn-ghost text-xl">Finals Schedule v0.2</a>
          </div>
          <div className="navbar-end">
            <input 
              type="text" 
              className="input input-bordered" 
              placeholder="Search" 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="p-4">
          <h1 className="text-2xl font-bold">Schedule Page</h1>
          <p>Term Code: {termCode}</p>
          <p>{year} {word} term</p>
        </div>
      </div>

      <div className="scrollable-table-container">
        <FixedSizeList
          height={400}
          itemSize={50}
          itemCount={filteredData.length}
          itemData={filteredData}>
          {({ index, style, data }) => {
            const item = data[index];
            const isAdded = addedCourses.some(
              (c) => c.course_number === item.course_number
            );
            return (
              <div style={style} key={item.course_number}>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    className="checkbox" 
                    checked={isAdded}
                    onChange={() => toggleCourse(item)}
                  />
                  {item.course_number} - {item.course_title}
                </div>
              </div>
            );
          }}
        </FixedSizeList>
      </div>
    </div>
  );
}

export default Schedule;

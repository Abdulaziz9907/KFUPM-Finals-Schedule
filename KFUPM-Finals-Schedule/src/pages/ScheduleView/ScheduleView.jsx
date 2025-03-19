import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { jsPDF } from "jspdf";
import { AddToCalendarButton } from 'add-to-calendar-button-react';
import "./ScheduleView.css";

function Schedule() {
  const location = useLocation();
  const { termCode, termURL } = location.state || {};
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedCourses, setAddedCourses] = useState([]);
  const [highlightedCourse, setHighlightedCourse] = useState(null);

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

  // Scroll and highlight course
  const scrollAndHighlightCourse = useCallback((courseNumber) => {
    setSearchTerm('');
    setInputValue('');
    setTimeout(() => {
      const courseRow = document.querySelector(`tr[data-course-number="${courseNumber}"]`);
      if (courseRow) {
        courseRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedCourse(courseNumber);
        setTimeout(() => setHighlightedCourse(null), 2000);
      }
    }, 100);
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

      if (response.data?.data) {
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

  // Memoized filtered data
  const filteredData = useMemo(() => 
    data.filter(item => 
      item.course_number.toLowerCase().includes(searchTerm.toLowerCase())
  ), [data, searchTerm]);

  // Course toggle handler
  const toggleCourse = useCallback((course) => {
    setAddedCourses(prev => 
      prev.some(c => c.course_number === course.course_number)
        ? prev.filter(c => c.course_number !== course.course_number)
        : [...prev, course]
    );
  }, []);

  // PDF export
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold").setFontSize(14).text("Selected Courses", 10, 10);
    doc.setFont("helvetica", "normal").setFontSize(10)
       .text(`Term Code: ${termCode}`, 10, 20)
       .text(`Term URL: ${termURL}`, 10, 25)
       .text(`${year} ${word} term`, 10, 30);

    const columns = [
      { title: "No.", x: 10 }, { title: "Course", x: 20 }, 
      { title: "Day", x: 80 }, { title: "Date", x: 100 },
      { title: "Time", x: 130 }, { title: "Location", x: 160 }
    ];
    
    let currentY = 40;
    doc.setFont("helvetica", "bold");
    columns.forEach(col => doc.text(col.title, col.x, currentY));
    currentY += 8;

    doc.setFont("helvetica", "normal");
    addedCourses.forEach((course, index) => {
      if (currentY > 280) { doc.addPage(); currentY = 10; }
      
      const day = new Date(convertDateFormat(course.date))
        .toLocaleDateString("en-US", { weekday: "long" });
      
      doc.text(String(index + 1), 10, currentY)
         .text(course.course_number, 20, currentY)
         .text(day, 80, currentY)
         .text(convertDateFormat(course.date), 100, currentY)
         .text(convertTo12HourFormat(course.time), 130, currentY)
         .text(course.location, 160, currentY);
      
      currentY += 8;
    });
    doc.save("selected-courses.pdf");
  };

  if (loading) return (
    <div className="schedule-container bg-gray-900 min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-4">Loading Schedule...</h1>
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  if (error) return (
    <div className="schedule-container bg-gray-900 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-4">Error</h1>
      <p className="text-red-500 text-xl">{error}</p>
    </div>
  );

  return (
    <div className="schedule-container bg-gray-900">
      <div className="fixed-header">
        <div className="navbar bg-gray-800 px-2 md:px-4 py-2">
          <div className="navbar-start flex-1">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn m-1 bg-gray-700 text-white hover:bg-gray-600">
                Added Courses ({addedCourses.length})
              </div>
              <div tabIndex={0} className="dropdown-content card card-compact bg-gray-700 text-white z-[1] w-80 p-2 shadow-xl">
                <div className="card-body">
                  {addedCourses.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto">
                      {addedCourses.map(course => (
                        <button 
                          key={course.course_number} 
                          className="btn btn-sm btn-ghost w-full text-left mb-1 text-white hover:bg-gray-600 transition-colors group"
                          onClick={() => scrollAndHighlightCourse(course.course_number)}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>
                              {course.course_number} - {convertTo12HourFormat(course.time)} - {course.date}
                            </span>
                            <span
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-full h-5 w-5 text-center flex items-center justify-center ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCourse(course);
                              }}
                            >
                              ×
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No courses added yet</p>
                  )}
                  {addedCourses.length > 0 && (
                    <button 
                      className="btn btn-sm mt-2 bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                      onClick={exportToPDF}
                    >
                      Export to PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="navbar-center flex-none">
            <h1 className="btn btn-ghost text-lg md:text-xl text-white">Finals Schedule v0.2</h1>
          </div>

          <div className="navbar-end flex-1 gap-2 justify-end">
            <label className="swap swap-rotate btn btn-ghost btn-sm md:btn-md p-2 bg-base-100 hover:bg-base-200 border-none">
              <input type="checkbox" className="theme-controller" value="synthwave" />
              <svg 
                className="swap-on h-6 w-6 md:h-8 md:w-8 fill-current text-primary" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
              >
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>
              <svg 
                className="swap-off h-6 w-6 md:h-8 md:w-8 fill-current text-secondary" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
              >
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>

            <label className="input input-bordered flex items-center gap-2 bg-gray-700 border-gray-600 w-32 md:w-auto">
              <input 
                type="text" 
                className="grow text-sm md:text-base text-white placeholder-gray-400"
                placeholder="Search..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearchTerm(inputValue)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
          </div>
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-bold text-white">Exam Schedule</h1>
          <div className="text-gray-300 space-y-1 mt-2">
            <p>Term Code: <span className="font-mono">{termCode}</span></p>
            <p>Academic Year: <span className="font-semibold">{year}</span></p>
            <p>Term: <span className="capitalize">{word} term</span></p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table w-full table-fixed bg-gray-800 text-white">
            <thead className="bg-gray-700">
              <tr>
                {Object.keys(data[0] || {}).filter(k => k !== "period").map(key => (
                  <th key={key} className="w-auto py-4">
                    {key === "time" ? "Time (12h)" : key}
                  </th>
                ))}
                <th className="py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredData.map((item, index) => (
                <tr 
                  key={index}
                  data-course-number={item.course_number}
                  className={`transition-all duration-300 ${
                    addedCourses.some(c => c.course_number === item.course_number) 
                      ? 'bg-gray-700' 
                      : 'hover:bg-gray-600'
                  } ${
                    highlightedCourse === item.course_number 
                      ? '!bg-purple-600 shadow-lg' 
                      : ''
                  }`}
                  onDoubleClick={() => toggleCourse(item)}
                >
                  {Object.entries(item)
                    .filter(([key]) => key !== "period")
                    .map(([key, value], idx) => (
                      <td key={idx} className="py-3">
                        {key === "time" ? convertTo12HourFormat(value) : value}
                      </td>
                    ))}
                  <td className="py-3">
                    <div className="flex items-center space-x-4">
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-primary"
                        checked={addedCourses.some(c => c.course_number === item.course_number)}
                        onChange={() => toggleCourse(item)}
                      />
                      <AddToCalendarButton
                        name={`${item.course_number} Final exam`}
                        description={`Final exam for ${item.course_title}`}
                        startDate={convertDateFormat(item.date)}
                        startTime={convertTo24HourFormat(item.time)}
                        endTime={convertTo24HourFormat(item.time)}
                        timeZone="Asia/Riyadh"
                        location={item.location}
                        trigger="click"
                        hideCheckmark
                        hideTextLabelButton
                        lightMode="bodyScheme"
                        styleLight="--btn-background: #4F46E5; --btn-text: #fff;"
                        options="'Apple','Google','Outlook.com'"
                        listStyle="modal"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Schedule;
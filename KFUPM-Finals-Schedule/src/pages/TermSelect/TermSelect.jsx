import "./TermSelect.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast, Flip } from 'react-toastify';

function TermSelect() {
  const navigate = useNavigate();

  const [term, setTerm] = useState("");
  const [termCode, setTermCode] = useState("");
  const [termURL, setTermURL] = useState("");

  const handleTermChange = (e) => {
    setTerm(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (term.length === 3) {
      const newTermCode = "20" + term + "0";
      setTermCode(newTermCode);
      const newTermURL =
        "https://registrar.kfupm.edu.sa/api/final-examination-schedule?term_code=" +
        newTermCode;
      setTermURL(newTermURL);

      console.log("success:", newTermCode);
      console.log(newTermURL);

      navigate("/Schedule-view", { state: { termCode: newTermCode, termURL: newTermURL } });
    } else {
      console.log("Error: Term length must be 3 characters.");
      
      setTerm("");
      setTermCode("");
      setTermURL("");

      toast.error('Term code must be 3 characters', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
        transition: Flip,
      });
    }
  };

  return (
    <div className="ts_body">
      <ToastContainer />

      <p id="loginWelcome">
        Welcome to <br />
        <strong>
          KFUPM<br />
          Final<br />
          Schedule
        </strong>
      </p>

      <form onSubmit={handleSubmit}>
        <label id="ts_term_label">Enter term*</label>
        <input
          type="text"
          required
          value={term}
          onChange={handleTermChange}
        />
        <button className="btn btn-outline">Default</button>
      </form>

      {termURL && <p>Term URL: {termURL}</p>}
    </div>
  );
}

export default TermSelect;

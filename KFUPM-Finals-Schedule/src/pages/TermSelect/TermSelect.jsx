import "./TermSelect.css";
import React, { useState } from 'react';

function TermSelect() {
    const [term, setTerm] = useState('');
    const [termCode, setTermCode] = useState('');
    const [termURL, setTermURL] = useState('');

    const handleTermChange = (e) => {
        setTerm(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault(); 

        const value = term; 
        if (value.length === 3) {
            
                const newTermCode = "20" + value + "0";
                setTermCode(newTermCode);
                console.log("success");

                const newTermURL = "https://registrar.kfupm.edu.sa/api/final-examination-schedule?term_code=" + newTermCode;
                setTermURL(newTermURL);
                console.log(newTermURL);
              } 

        else {
            console.log("error length");
            setTermCode('');
        }
    };

    return (
        <div className="ts_body">
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
                <button type="submit">Submit</button>
            </form>

            {termURL && <p>Term URL: {termURL}</p>}
        </div>
    );
}

export default TermSelect;

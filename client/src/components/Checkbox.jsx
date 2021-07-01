import React from 'react';
import '../styles/Checkbox.css'

export default function Checkbox(props) {

    return(
        <p className = 'checkbox-container'>
            <input type="checkbox" id="test1" checked = {props.checked} onClick = {props.onClick} onChange = {()=>{}} />
            <label htmlFor="test1"></label>
        </p>
    )
}


import React from 'react'
import '../styles/Button.css'

export default function Button(props) {
    return(
        <button 
            type = "submit"
            className = "button"
            style = {props.buttonStyle}
            onClick = {props.onClick}    
        >

            <p className = "button-text" style = {props.textStyle }>
                {props.buttonText}
            </p>

        </button>
    )
}
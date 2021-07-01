
import React from 'react';
import Icon from 'react-web-vector-icons'
import '../styles/ErrorText.css'

export default function ErrorText(props) {
    return(
        <div className = "error-text-container">

            <Icon
                name = {props.image}
                font = 'Entypo'
                color = {props.imageColor}
                size = {15}
                // style={{}}
            />

            <p className = "login-error-text" style = {{color: props.textColor}}>
                {props.errorText}
            </p>

        </div>
    )
}

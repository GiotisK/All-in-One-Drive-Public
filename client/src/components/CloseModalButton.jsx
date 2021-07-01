import React from 'react'
import Icon from 'react-web-vector-icons'

export default function CloseModalButton(props) {

    return(
        <div 
            onClick = {props.onClick}
            style = {{
                position: 'absolute', 
                right: '6px', 
                top: '6px',
                cursor: 'pointer',
            }}
        >
        <Icon
            name = 'close'
            font = 'AntDesign'
            color = 'black'
            size = {28} 
        />
        </div>
    )
}
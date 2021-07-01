import React from 'react'
import Icon from 'react-web-vector-icons'
import '../styles/DriveElement.css'

export default function DriveElement(props) {

    return(
        <div 
            className = "drive-element__container"
            style = {{opacity: props.opacity}}
            onClick = {props.onClick}
            
        >
            <Icon
                name = {props.driveName}
                font = 'Entypo'
                color = {'gray'}
                size = {35}
                style={{paddingRight: '3%', paddingLeft: '3%', paddingTop: '5%', paddingBottom: '5%', margin: 0}}
            />
            <div className = "email-quota__container">
                <p className = "drive-element-email">
                    {props.email}
                </p>
                <p className ="drive-element-quota">
                    {props.quota} GB
                </p>
            </div>

            <div className = "isActive-container">
                <div className = 'trashcan-div' onClick = {props.onDeleteDriveClick}>
                    <Icon 
                        name = 'trash-o'
                        font = 'FontAwesome'
                        color = {'gray'}
                        size = {20}
                        style = {{alignSelf: 'flex-end', marginBottom: '8px', marginRight: '7px'}}
                    />
                </div>
                <div className = {props.className}>
                    
                </div>
            </div>
        </div>
    )
}
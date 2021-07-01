import React, { useState } from 'react';
import '../styles/UserMenu.css'

export default function UserMenu(props) {
    const [menuActive, setMenuActive] = useState(false)
    const [circleButtonContainerClass, setCircleButtonContainerClass] = useState('circle-button__container-inactive')
    const [borderStyle, setBorderStyle] = useState({
        borderStyle: 'none',
    })
    /* const [redirect, setRedirect] = useState(false) */

    function showMenu() {
        setMenuActive(true)
        setCircleButtonContainerClass('circle-button__container-active')
        setBorderStyle({borderStyle: 'solid', boxShadow: '0 0 10px #99c6f3'})
        document.addEventListener('click', hideMenu)
    }

    function hideMenu() {
        setMenuActive(false)
        setCircleButtonContainerClass('circle-button__container-inactive')
        setBorderStyle({borderStyle: 'none'})
        document.removeEventListener('click', hideMenu)
    }

    const popupMenu = 
        <div className = "popup-menu">
            <div className = "username-container">
                <p className = "user-text">
                    User
                </p>
                <p className = "username-text">
                    {props.email}
                </p>
            </div>

            <div onClick = {props.onAddDriveClick} className = "settings-container">
                <p className = "settings-text">
                    Add a drive
                </p>
            </div>

            <div onClick = {props.onSwitchDriveModeClick} className = "settings-container">
                <p className = "settings-text">
                    {props.virtualDriveEnabled ? 'Switch to all-in-one drive': 'Switch to virtual drive'}
                </p>
            </div>
            
            
            <div className = "signout-container" onClick = {props.onSignOutClick}>
                <p className = "signout-text">
                    Sign out
                </p>
            </div>
        </div>


    return(
        <div className = "popup-menu__container">
            <div 
                style = {borderStyle}
                className = {circleButtonContainerClass}
                onClick = {()=>{menuActive ? hideMenu() : showMenu()}}
            >
                <p className = "circle-button__letter">
                    {props.email ? props.email.charAt(0).toUpperCase() : null}
                </p>
            </div>
            {
                menuActive ? popupMenu : null
            }
            
        </div>
    )

}


/* const letter = title.charAt(0).toUpperCase( */
import React from 'react';
import '../styles/TitleBanner.css'
import UserMenu from './UserMenu.jsx'
import Loader from './Loader.jsx'
import Icon from 'react-web-vector-icons'

export default function TitleBanner(props) {
    return(
        <div className = "banner-container">
            <div 
                className = "logo-menu-container"
            >  
                {props.virtualDriveEnabled === true || props.popupMenu === false ? null : (
                    <div className = "burger-menu-button" onClick = {props.onBurgerMenuClick} >
                        <Icon
                            font = 'Entypo'
                            name = 'menu'
                            color = 'white'
                            size = {38}
                            style = {{userSelect: 'none', cursor: 'pointer'}}
                        />
                    </div>
                )}
                
                  <p className = "logo-title">
                    aio drive
                </p>
            </div>
            {props.virtualDriveEnabled === false || props.popupMenu === false ? null : 
                (
                    props.virtualQuota === null ? (
                        <div className = "quota-loader-container">
                            <p className = "quota-string-loader">
                                Virtual Quota: 
                            </p>
                            <Loader
                                loadingText = {false}
                                size = {'10px'}
                            />
                        </div>
                    ) : (
                        <p className = "quota-string"> 
                            Virtual Quota: <span className = "quota-gigabytes">{props.virtualQuota}</span>
                        </p>
                    )
                )
            }
           {props.popupMenu === false ? null : (
                <UserMenu
                email = {props.email}
                virtualDriveEnabled = {props.virtualDriveEnabled}
                onAddDriveClick = {props.onAddDriveClick}
                onSignOutClick = {props.onSignOutClick}
                onSwitchDriveModeClick = {props.onSwitchDriveModeClick}
            />
            )}

                    
        </div>
    )
}
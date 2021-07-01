import React from 'react';
import '../styles/AddDriveButton.css'
import Icon from 'react-web-vector-icons'

export default function AddDriveButton(props){
   
    return(

        props.buttonType === 'drive' ? 
        (
            <div className = "add-drive-button__container" style={{width:'130px', height:'130px'}} onClick = {props.onClick}>
                <Icon
                    name = {props.name}
                    font = 'Entypo'
                    color = 'gray'
                    size = {60} 
                    style = {{marginTop: '7%'}}
                />
                <p className = "add-drive-button-text" style = {{fontSize: '17px'}}>
                    {props.name === 'dropbox' ? 'Dropbox' : (
                        props.name === 'google-drive' ? 'Google Drive' : 'OneDrive'
                    )}
                </p>
            </div>

        ) : (

            <div className = "add-drive-button__container" style={{width:'40px', height:'40px'}} onClick = {props.onClick}>

                <p className = "add-drive-button-text" style = {{fontSize: '11px'}}>
                   {props.format}
                </p>
            </div>

        )
        
        
    )
}
import React, { useState, useImperativeHandle, forwardRef } from 'react'
import AddDriveButton from './AddDriveButton'
import Button from './Button'
import Icon from 'react-web-vector-icons'
import CloseModalButton from './CloseModalButton'
import InputField from './InputField'

const Modal = (props, ref) => {

    const [visible, setVisible] = useState(false)

    useImperativeHandle(ref, () => ({

        showModal() {
            setVisible(true)
        },
        hideModal() {
            setVisible(false)
        }
        
    }));

    function hideModal() {
        setVisible(false)
    }

    function getModalTitle(){
        switch(props.modalType){
            case 'addDriveModal':
                return 'Add a Drive'
            
            case 'deleteModal':
                return `Delete ${props.deleteMode} ?`

            case 'exportModal':
                return 'Export Google file as:'

            case 'renameModal':
                return 'Rename file:'

            case 'shareVirtualModal':
                return 'Enter user email to share with:'
        
        }
    }

    return(
        visible ? (
            <div className = "modal-container" >
                <div className = "modal-container-clickable" onClick = {hideModal} />  
                    
                <div className = "modal">              
                    <CloseModalButton onClick = {hideModal} />    
                    <div className = "add-drive__container">
                        <p className = "add-drive-text">
                            {getModalTitle()}
                        </p>
                    </div>
                    {props.modalType === 'addDriveModal' ? 
                        (
                            <div className = "add-drive-buttons__container">
                                <AddDriveButton
                                    buttonType = 'drive'
                                    name = 'google-drive'
                                    onClick = {props.onAddGoogleDriveClick}
                                />
                                <AddDriveButton
                                    buttonType = 'drive'
                                    name = 'dropbox'
                                    onClick = {props.onAddDropboxClick}
                                />
                                <AddDriveButton
                                    buttonType = 'drive'
                                    name = 'onedrive'
                                    onClick = {props.onAddOneDriveClick}
                                />
                            </div>
                        ) : 
                        ( props.modalType === 'deleteModal' ? 
                            (
                                <div className = "dialog-container">
                                    <div className = "delete-confirm-text-container">
                                        <p className = "delete-confirm-text">
                                            Are you sure you want to delete the {props.deleteMode}
                                            {props.deleteMode === 'file' ? 
                                                <span> "{props.fileNameForDelete}"</span> :
                                                <>
                                                    &nbsp;associated with&nbsp;"
                                                    <span>    
                                                        <Icon
                                                            name = {props.driveForDelete.type}
                                                            font = 'Entypo'
                                                            color = 'black'
                                                            size = {20} 
                                                        />
                                                        &nbsp;
                                                        {props.driveForDelete.email}"
                                                    </span>
                                                </>
                                            }
                                            &nbsp;?
                                        </p>
                                    </div>
                                    <div className = "delete-buttons-container">
                                        <Button
                                            buttonText = "Cancel"
                                            buttonStyle = {{
                                                margin: '3% 5% 3% 1%', 
                                                backgroundColor: 'white', 
                                                border:'1px solid lightgray',
                                                borderRadius: '5px'
                                            }}
                                            textStyle = {{color: 'black',borderRadius: '5px'}}
                                            onClick = {hideModal}
                                        />
                                        <Button
                                            buttonText = "Delete"
                                            buttonStyle = {{margin: '3% 1% 3% 1%'}}
                                            onClick = {props.onConfirmDeleteClick}
                                        
                                        />
                                    </div>
                                </div>
                            ) :
                            ( props.modalType === 'exportModal' ? 
                           
                                (
                                    <div className = "add-drive-buttons__container">
                                        {props.exportFormats.map((format, index)=>{
                                            return(
                                                <AddDriveButton
                                                    key = {index}
                                                    buttonType = 'format'
                                                    format = {format}
                                                    onClick = {()=>{props.onExportFormatClick(format)}}
                                                />
                                            )
    
                                        })}
                                                          
                                    </div>
                                ) :
                                (
                                    <div className = "rename-container">
                                        <div className = "rename-form-text-container">
                                            <InputField
                                                title = {''}
                                                type = {'text'}
                                                value = {props.renameValue}
                                                onChange = {props.onRenameChange}
                                                outlineStyle = 'rename'
                                            />
                                        </div>
                                    
                                        <div className = "delete-buttons-container">
                                            <Button
                                                buttonText = "Cancel"
                                                buttonStyle = {{
                                                    margin: '3% 5% 3% 1%', 
                                                    backgroundColor: 'white', 
                                                    border:'1px solid lightgray',
                                                    borderRadius: '5px'
                                                }}
                                                textStyle = {{color: 'black', borderRadius: '5px'}}
                                                onClick = {hideModal}
                                            />
                                            <Button
                                                buttonText = "OK"
                                                buttonStyle = {{margin: '3% 1% 3% 1%'}}
                                                onClick = {props.modalType === 'renameModal' ? props.onConfirmRenameClick : props.onConfirmVirtualShareClick}
                                            />
                                        </div>
                                    </div>
                                    
                                )

                            )
                        )
                    }
                    
                </div>
            </div> 
        ) : null
    )
}

export default forwardRef(Modal)
import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import CloseModalButton from './CloseModalButton'
import Icon from 'react-web-vector-icons'
import '../styles/Modal.css'
import '../styles/UploadModal.css'

let modalHeight;

const UploadModal = (props, ref) => {

    const [visible, setVisible] = useState(false)

    useEffect(()=>{
        modalHeight = 110
        if(props.objects.length > 1 && props.objects.includes('')){
            modalHeight += (props.objects.length-1) * 30
        }else{
            modalHeight += (props.objects.length) * 30
        }
    })

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

    function getCorrectTitle(){
        if(props.type === 'file'){
            return 'Select a drive to upload the file'
        }else if(props.type === 'folder'){
            return 'Select a drive to create the folder'
        }else if(props.type === 'virtual_unshare'){
            return 'Remove a user from sharing'
        }
    }

    return(
        
        !visible ? null : (
            <div className = "modal-container">
                <div className = "modal-container-clickable" onClick = {hideModal} /> 

                <div className = "upload-modal" style = {{height: modalHeight}}>
                    <CloseModalButton onClick = {hideModal} />
                    <div className = "add-drive__container">
                        <p className = "upload-drive-text">
                            {getCorrectTitle()}
                            
                        </p>
                    </div>
                    {
                        props.objects.length === 0 ? <p style={{textAlign: 'center', fontSize: '20px', color:'gray'}}>No drives found...</p> : (
                            <div className = "drive-row-scrollview">
                            {
                                props.objects.map((object, index) => {
                                    if(object === ''){
                                        return null
                                    }else if(props.type === 'virtual_unshare' && object !== ''){
                                        return(
                                            <div 
                                                key={index} 
                                                className = "drive-row"
                                                onClick = {()=>{props.onSpecificRowClick(object)}}
                                            >
                                           { <Icon 
                                                font = 'Entypo'
                                                name = {'cloud'}
                                                color = 'gray'
                                                style = {{padding: '1%', marginLeft: '2px'}}
    
                                            />}
                                            <p className = 'drive-row-email-text'>
                                                {object}
                                            </p>
                                            <Icon 
                                                font = 'FontAwesome'
                                                name = {'trash-o'}
                                                size = {'20px'}
                                                color = 'gray'
                                                style = {{padding: '1%', marginLeft: '10px'}}
                                            />
                                        </div>
                                        )
                                    }else{
                                        return(
                                            <div 
                                                key={index} 
                                                className = "drive-row"
                                                onClick = {()=>{props.onSpecificRowClick(object)}}
                                            >
                                                <Icon 
                                                    font = 'Entypo'
                                                    name = {object.driveName}
                                                    color = 'gray'
                                                    style = {{padding: '1%', marginLeft: '2px'}}
        
                                                />
                                                <p className = 'drive-row-email-text'>
                                                    {object.email}
                                                </p>
                                                
                                            </div>
                                        ) 
                                    } 
                                })
                            }
                           
                        </div>
                        )
                    }
                   
                </div>
            </div>
        )
      
    )
}


export default forwardRef(UploadModal)
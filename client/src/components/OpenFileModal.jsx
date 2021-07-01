import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { mimeTypes } from '../utilities/MediaUtilities.js'
import CloseModalButton from './CloseModalButton'
import '../styles/OpenFileModal.css'

const OpenFileModal = (props, ref) => { 
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

    return(
        visible ? (
         
            <div className = "modal-container" >
                <div className = "modal-container-clickable" onClick = {hideModal} />
                             
                    
                    {props.type === 'audio' ? (
                            <div className = "sound-modal"> 
                                <CloseModalButton onClick = {hideModal} />
                                <audio controls="controls" src={props.openFileLink.src} type={mimeTypes[props.openFileLink.extension]} /> 
                            </div>
                        ) : (
                            props.type === 'video' ? (
                                <video className = "open-video-container" controls="controls" src={props.openFileLink.src} type={mimeTypes[props.openFileLink.extension]} /> 
                            ) : ( //else if image
                                <img className = 'open-image-container' src={props.openFileLink.src}/>
                            )
                        )
                    }
      
                
            </div>
        ): null
    )   
}

export default forwardRef(OpenFileModal)
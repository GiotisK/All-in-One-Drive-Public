import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import '../styles/FloatingAddButton.css'
import Icon from 'react-web-vector-icons'

const FloatingAddButton = (props, ref) => {
    const uploaderRef = useRef(null)
    
    useImperativeHandle(ref, () => ({

        openPicker() {
            uploaderRef.current.click()
        }
     
    }));

    return(
        <div 
            className = {props.classes}/*  {`floating-button ${props.extraClass}`} */
            style = {{backgroundColor: props.color}}
            onClick = {props.onClick/* (e)=>openPicker(e) */}
        >
            {props.name !== 'addfile' ? null : (
                <input 
                    type="file" 
                    id="file" 
                    ref={uploaderRef} 
                    style={{display: "none"}}
                    onChange={props.onOpenFileClick}
                />
            )}
            
            
            <Icon
                font = 'AntDesign'
                name = {props.name}
                color = 'white'
                size = {30}
                style = {{pointerEvents: 'none'}}
            />
            
        </div>
    )
}

export default forwardRef(FloatingAddButton)
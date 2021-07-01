import React, { useState } from 'react'
import FloatingAddButton from './FloatingAddButton'
import '../styles/AddButtons.css'

let timer;

export default function AddButtons(props) {
    const [pressed, setPressed] = useState(null)
    const [classes, setClasses] = useState({
        plusButton:'floating-button',
        fileButton: 'floating-button',
        folderButton: 'floating-button'
    })
    function onPress() {
        if(pressed){
            setPressed(false)
            setClasses({
                plusButton: 'floating-button animation-class4',
                fileButton: 'floating-button animation-class1',
                folderButton: 'floating-button animation-class2'
            })
            timer = setTimeout(()=>{
                setClasses({
                    plusButton: 'floating-button',
                    fileButton: 'floating-button animation-class1',
                    folderButton: 'floating-button animation-class2'
                })
            },800)
        }else{
            clearTimeout(timer)
            setPressed(true)
            setClasses({
                plusButton: 'floating-button animation-class3',
                fileButton: 'floating-button animation-class1',
                folderButton: 'floating-button animation-class2'
            })
        }
    }

    return(
        <div className = "add-buttons-container">
            {!pressed ? null : (
                <>
                    <FloatingAddButton
                        ref = {props.uploadFileButtonRef}
                        name = 'addfile'
                        color = 'orange'
                        onClick = {()=>{props.onUploadClick('file')}}
                        onOpenFileClick = {props.onOpenFileClick}
                        classes = {classes.fileButton}/* 'animation-class1' */
                    />
                    <FloatingAddButton
                        name = 'addfolder'
                        color = 'red'
                        onClick = {()=>{props.onUploadClick('folder')}}
                        classes = {classes.folderButton} /* 'animation-class2' */
                        /* onClick = {props.onCreateFolderClick} */
                    />
                </>
            )}
            
            <FloatingAddButton
                name = 'plus'
                color = '#24a0ed'
                onClick = {onPress}
                classes = {classes.plusButton} /* {pressed ? 'animation-class3' : (pressed===false ? 'animation-class4' : '')} */
            /> 
        </div>
    )
}
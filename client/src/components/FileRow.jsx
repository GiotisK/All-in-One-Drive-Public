import React, { useState, useEffect } from 'react'
import '../styles/FileRow.css'
import Icon from 'react-web-vector-icons'
import FileElement from './FileElement'
import { formatBytes } from '../utilities/MediaUtilities.js'

export default function FileRow(props) {
    
    const isShared = (
        props.filePermissions.includes('anyoneWithLink') || 
        props.filePermissions[0].includes('dropbox') || 
        props.filePermissions[0].includes('onedrive') || 
        props.filePermissions[0].includes('shared') ||
        props.filePermissions[0].includes('@') ||
        props.filePermissions[1] !== undefined && props.filePermissions[1].includes('@')
    )
    const [menuTexts, propFuncs] = getMenuTextsAndFuncs()
    const [menuActive, setMenuActive] = useState(false)
    const [menuButtonClass, setMenuButtonClass] = useState("action-icon-div-inactive")

    function getMenuTextsAndFuncs() {
        if(props.fileType === 'folder' && (props.fileDrive === 'google-drive' || props.fileDrive === 'onedrive' || props.fileDrive === 'aio-drive') ){
            return [ 
                ['Rename', (!isShared ? 'Share' : 'Unshare'), 'Delete'],
                [props.onRenameClick, ()=>props.onShareClick(isShared), props.onDeleteClick]
            ]

        }else if(props.fileType === 'file' && props.fileDrive === 'aio-drive' && props.fileEmail !== props.userEmail){
            return [
                ['Download'],
                [props.onDownloadClick]
            ]
        }else{
            return [
                ['Download', 'Rename', (!isShared ? 'Share' : 'Unshare'), 'Delete'],
                [props.onDownloadClick, props.onRenameClick, ()=>props.onShareClick(isShared), props.onDeleteClick]
            ]

        }
        
    }
    function showMenu() {
        setMenuActive(true)
        setMenuButtonClass("action-icon-div-active")
        document.addEventListener('click', hideMenu)
    }

    function hideMenu() {
        setMenuActive(false)
        setMenuButtonClass("action-icon-div-inactive")
        document.removeEventListener('click', hideMenu)
    }

    const actionsPopupMenu = 
    
        <div className = "action-popup-menu">
            {
                menuTexts.map((text, index) => 
                    <div 
                        key = {index} 
                        className = "action-text-container"
                        onClick = {propFuncs[index]}
                    >
                        <p className = "action-text">
                            {text}
                        </p>
                    </div>
                )
            }  
        </div>
    
    const actionsButtonAndChildren = 
        ( (props.fileDrive === 'aio-drive' && props.fileType ==='folder' && props.userEmail !== props.fileEmail) ||
          (props.fileDrive === 'aio-drive' && props.fileType ==='folder' && props.userEmail === props.fileEmail && props.fileName === 'Shared with me')
        ? null :
            <div 
                className = {menuButtonClass}
                onClick = {()=>{menuActive ? hideMenu() : showMenu()}}
            >
                <Icon
                    font = 'Entypo'
                    name = {'dots-three-horizontal'}
                    color = {'gray'}
                    size = {25}
                    style = {{padding: '5px'}}
                />
            
                {menuActive ? actionsPopupMenu : null}
            </div>
        )

    return(
        <div className = "file-row__container">
            <div className = "filename-div" onClick = {props.onFileClick}>
                <FileElement
                    fileType = {props.fileType}
                    fileExtension = {props.fileExtension}
                    fileName = {props.fileName}
                    fileEmail = {props.fileEmail}
                    userEmail = {props.userEmail}
                />
                <p className = "filename-text">
                    {props.fileName}
                </p>
            </div>
            <div className = "drive-div">
                <Icon
                    name = {props.fileDrive === 'aio-drive' ? 'cloud' : props.fileDrive}
                    font = 'Entypo'
                    color = {'gray'}
                    size = {32}
                    // style={{fontSize: 50}}
                />
                <p className = "email-text">
                    {props.fileEmail}
                </p>
            </div>
            <div className = "size-div">
                <p className = "email-text">
                    {formatBytes(props.fileSize)}
                </p>
            </div>
            <div className = "date-div"> 
                <p className = "date-text">
                    {props.fileDate}
                </p>
                {actionsButtonAndChildren}
                    
                {!isShared ? null : (
                    <div 
                        className = "share-icon-div" 
                        onClick = {
                            props.fileDrive === 'aio-drive' ? props.onAddSharedUser : 
                            props.onCopyShareLinkClick
                        }
                    >
                        <Icon
                            font = {props.fileDrive === 'aio-drive' ? 'AntDesign' : 'Entypo'}
                            name = {props.fileDrive === 'aio-drive' ? 'adduser' : 'link'}
                            color = {'#82d882'}
                            size = {20}
                            style = {{padding: '5px', userSelect: 'none'}}
                        />
                    </div>
                )}
               
            </div>
        </div>
    )
}
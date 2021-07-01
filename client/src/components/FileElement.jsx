import React from 'react';
import '../styles/FileElement.css'
import Icon from 'react-web-vector-icons'

export default function FileElement(props) {

    const {userEmail, fileName, fileEmail, fileExtension} = props
    
    if(props.fileType === 'folder'){
        return(
            <div className = 'folder-element__container'>
                {
                    fileName === 'Shared with me' && fileEmail === userEmail ? 
                    (
                        <Icon
                            font = 'Ionicons'
                            name = {'md-people'}
                            color = {'white'}
                            size = {22}
                        />
                    ) : null
                }
               
            </div>
        )
    }else{
        return(
            <>
                <div 
                    className = "file-element__container"
                >
                    <p className = "file-text">
                        {fileExtension}
                    </p>
                </div>
            </>
        )
    }
}
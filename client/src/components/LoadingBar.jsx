import React from 'react'
import '../styles/LoadingBar.css'

export default function LoadingBar(props) {
    
    const {percentage, loaded, total, totalFilesBeingUploaded, currentFileNumBeingUploaded} = props.uploadPercentage
    let divClass = (props.isUploading ? "loading-bar-container-open" : "loading-bar-container-closed")

    return(
        <div className = {divClass}>
           <div style = {{position: 'relative'}}>
                <div className = "progress-bar" style={{width: 400*percentage / 100 }}>
                    <p className = "progress-text">
                        {percentage}% ({loaded}/{total} MB){totalFilesBeingUploaded > 0 ? ` - ${currentFileNumBeingUploaded}/${totalFilesBeingUploaded} files` : null}
                    </p> 
                </div>    
           </div>
        </div>
    )
}
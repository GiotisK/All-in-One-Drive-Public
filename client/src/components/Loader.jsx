import React, { useState, useImperativeHandle, forwardRef } from 'react'
import '../styles/Loader.css'

export default function Loader(props){
    return(
        <div style = {{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'center', marginTop: (props.loadingText === true ? '15px' : '0px')}}>
            
            <div 
                className = "loader" 
                style={{height: props.size, width: props.size}}
            >
            </div>
                {props.loadingText === false ? null : (
                    <p className ='loading-text'>Loading...</p>
                )
            }
            
        </div> 
    )
}
import React from 'react'
import '../styles/MenuTab.css'

export default function MenuTab(props) {
    return(
        <div className = {props.title + "-scrollview-menu__tab"}>
            <p className = "tab-title">
                {props.title}
            </p>
        </div>
    )
}
import React, { useState } from 'react'
import Icon from 'react-web-vector-icons'
import '../styles/SortMenu.css'

export default function SortMenu(props) {
    const sortObjs = [
        {
            text: 'Sort by',
            containerClass: 'sort-by-container',
            textClass: 'sort-by-text'
        },
        {
            text: 'Drive',
            containerClass: 'sort-drive-container',
            textClass: 'sort-drive-text'
        },
        {
            text: 'Date',
            containerClass: 'date-container',
            textClass: 'sort-date-text'
        },
    ]
    const [menuActive, setMenuActive] = useState(false)
    const [sortIconClass, setSortIconClass] = useState('sort-button-container-before')

    function showMenu() {
        setMenuActive(true)
        setSortIconClass('sort-button-container-after')
        document.addEventListener('click', hideMenu)
    }

    function hideMenu() {
        setMenuActive(false)
        setSortIconClass('sort-button-container-before')
        document.removeEventListener('click', hideMenu)
    }


    const popupSortMenu = 
        <div className = "sort-popup__menu">
            {
                sortObjs.map((obj, index) =>
                    <div key = {index} className = {obj.containerClass} > 
                        <p className = {obj.textClass}>
                            {obj.text}
                        </p>
                    </div>
                )
            }
        </div>

    return(
        <div className = "sort-menu__container">
            <div 
                className = {sortIconClass} 
                onClick = {()=>{menuActive ? hideMenu() : showMenu()}}
            >
                <Icon
                    font = 'FontAwesome'
                    name = 'sort'
                    size = {19}
                    style = {{padding:'5px'}}
                />

            </div>

            {
                menuActive ? popupSortMenu : null
            }

        </div>
    )
}
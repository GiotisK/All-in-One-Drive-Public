import React from 'react';
import MenuTab from './MenuTab.jsx'
import Checkbox from './Checkbox.jsx'
import '../styles/MenuBanner.css';
import Icon from 'react-web-vector-icons'
const tabTitles = ['Name', 'Drive', 'Size', 'Date']
export default function MenuBanner(props) {
    return(
        <div> 
            <div className = "shadow-div"/>
            <div className = "scrollview-menu__container" >
                {!props.isInRoot ? null : (
                    <div className = "sidebar-overlap" style = {{display: props.sideMenuDisplay}}>
                            <div style = {{display: 'flex', flexDirection: 'row', justifyContent:'flex-start', alignItems: 'baseline'}}>
                                <p 
                                    className = "connected-drives__text"
                                    onClick = {props.onDivClick} 
                                >  
                                    Connected Drives
                                </p>
                                <Checkbox
                                    onClick = {props.onCheckboxClick}
                                    checked = {props.checkboxChecked}
                                />
                                <div onClick = {props.onCloseSideMenuClick}> 
                                    <Icon
                                        name = 'close'
                                        font = 'AntDesign'
                                       /*  color = 'gray' */
                                        size = {23}
                                        style = {{marginLeft: 50, userSelect: 'none', cursor: 'pointer'}}
                                        className = "sidemenu-close-button"
                                    />
                                </div>
  
                            </div>
                            
                        <div className = "sidebar-overlap__border"/>
                    </div>
                )}
                
                <div className = "scrollview-menu" style={props.backButtonEnabled ? {marginLeft: '0px' } : {marginLeft: '10px'} }>
                   
                    {
                        props.backButtonEnabled? (
                            <div 
                                className="back-button-container" 
                                onClick = {props.onBackButtonClick} 
                                style = {props.isUploading ? {pointerEvents: 'none', cursor: 'default'} : {pointerEvents: 'all', cursor: 'pointer' } }
                            >
                                <Icon
                                    font = 'Ionicons'
                                    name = 'ios-arrow-back'
                                    color = {props.isUploading ? 'lightgray' : 'gray'}
                                    size = {23}
                                    style = {{paddingLeft: '5px', paddingRight: '5px'}}
                                />
                            </div>

                        ) : null
                    }
                    {tabTitles.map((title, index) => {
                        return(
                            <MenuTab 
                                key = {index}
                                title = {title}
                            />
                        )
                    })}
                    { props.dragEnter ?  (
                        <div className = "drop-arrow-div">
                            <Icon 
                                font = "FontAwesome"
                                size = {50}
                                name = "hand-o-down"
                                color = "#24a0ed"
                                style ={{/* textShadow: '2px 3px 6px gray', */ paddingLeft: '25%', marginBottom: '5%'}}  
                            />
                            <div className ="drop-text-container">
                                <p className="drop-text">Drop file(s)</p>
                            </div>
                        </div>
                        ) : null
                    }
                    
                </div>
            </div>
        </div>
    )
}

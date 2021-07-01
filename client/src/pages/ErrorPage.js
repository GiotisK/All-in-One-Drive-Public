import React from 'react'
import TitleBanner from '../components/TitleBanner'
import '../styles/ErrorPage.css'

export default function ErrorPage(props){
    let errorObj = {}

    props.errorType === "notFound" ? 
       errorObj = {greet: "Ooops!", errorCode: "404", msg: "Seems that this page doesn't exist...", buttonType: 'back' } :
       errorObj = {greet: "Sorry!", errorCode: "401", msg: "You are not authorized to view this page.", buttonType: 'to login' }

    return(
        <div className = "error-page__body">
            <TitleBanner 
                popupMenu = {false}
            />
            <div className = "error-elements__container">
                <h1 className = "oops-text">
                     {errorObj.greet}
                </h1>
                <h2 className = "info-text">
                    {errorObj.msg}
                    
                </h2>
                <h3 className = "error-code-text">
                    (Error Code: {errorObj.errorCode})

                </h3>

                <a href = "http://localhost:3000">
                    Go {errorObj.buttonType}
                </a>

            </div>
        </div>
    )
}


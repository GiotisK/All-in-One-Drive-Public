import React, { useState, useEffect } from "react";
import { Redirect } from 'react-router-dom'
import CredentialsBox from '../components/CredentialsBox'
import '../styles/LandingPage.css'
import photo from '../photos/drive.png'

export default function LandingPage() {

    const [cookieRedirect, setCookieRedirect] = useState()

    useEffect(() => {
        checkForTokenAndRedir()
    }, []) //passing [] as argument is equivalent to old componentDidMount


    function checkForTokenAndRedir() {

        fetch("http://localhost:9000/checkToken", {
            method: 'GET',
            credentials: 'include', //CARE: maybe 'include' is needed if you want to signup for example from a different browser than the developer's browser

        }).then(res => {
            if (res.status === 200) {
                setCookieRedirect(true)
                
            } else {
                setCookieRedirect(false)
                
            }
        })
        .catch(err => {
          console.error(err);
        });

    }

    return (

        cookieRedirect ? <Redirect to = "/drive"/> : ( 

            cookieRedirect === undefined ? null : (

                <div className = "App">
                    
                    <svg className = "svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 340">
                        <path fill="#24a0ed" fillOpacity="1" d="M0,128L40,154.7C80,181,160,235,240,234.7C320,235,400,181,480,165.3C560,149,640,171,720,192C800,213,880,235,960,208C1040,181,1120,107,1200,85.3C1280,64,1360,96,1400,112L1440,128L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z"></path>
                    </svg>
                    <p className = "landing-page__title">aio drive</p>

                    <div className = "x-container">
                        <div className = "landing-photo_div">
                            <img src = {photo} alt = "landing" className = "landing-photo" />
                            <p className ="landing-text">  The most commercial drives all in one place.</p>
                        </div>
                        <div className = "box-container">
                            <CredentialsBox />
                        </div>
                    </div>
                
                </div>
            )
        )  
    );
}

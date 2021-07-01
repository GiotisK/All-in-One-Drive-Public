import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DrivePage from './pages/DrivePage'
import ErrorPage from './pages/ErrorPage'


export default function App() {
    return(
        <Router>
            <Switch>
                <Route path = "/" exact component = {LandingPage}/>
                <Route path = "/drive" exact component = {DrivePage} />
                <Route path = "/unauthorized" exact render={(props) => <ErrorPage errorType="unauthorized"/>} />
                <Route render={(props) => <ErrorPage errorType="notFound" />}/>
            </Switch>
        </Router>
    )
    
}
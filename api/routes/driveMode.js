import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import { getDriveModeFromDatabase, saveDriveModeInDatabase } from '../src/utilities/MongoFunctions.js'


let router = express.Router();

router.get('/driveMode', authorizeRoute, async function(req, res, next) {
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break

        case('valid_token'):  
            const virtualDriveEnabled = await getDriveModeFromDatabase(req.email)
            res.status(200).send(virtualDriveEnabled)
            break
    }
})

router.patch('/driveMode', authorizeRoute, async function(req, res, next) {
    const {virtualDriveEnabled} = req.body 

    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break

        case('valid_token'):  
            const response = await saveDriveModeInDatabase(req.email, virtualDriveEnabled)

            if(response === 'OK'){
                res.status(200).send('OK')
            }else{
                res.status(200).send('Something went wrong with setting drivemode in database')
            }

            
            break
    }
})

module.exports = router;
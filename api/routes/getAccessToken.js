import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import { getTokenFromDatabase } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.post('/getAccessToken', authorizeRoute, async function(req, res, next) {
    let drive;
    const { driveEmail, driveType, fileId } = req.body

    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break

        case('valid_token'):        
            switch(driveType){
                case "google-drive":
                    drive = new GoogleDriveHandler()
                    break
                
                case "dropbox":
                    drive = new DropboxHandler()
                    break
                
                case "onedrive":
                    drive = new OneDriveHandler()
                    break
            }
            getAccessToken(res, req.email, drive, driveEmail, driveType )

        break
    }

});



async function getAccessToken(res, userEmail, drive, driveEmail, driveType){
    let responseObj;

    let token = await getTokenFromDatabase(userEmail, driveEmail, driveType).catch(err=>{
        console.log(err)
        responseObj = createJsonResponse('get_token_failed', "Couldn't fetch drive token from database")
        res.status(500).send(responseObj)
    })

    if(token){
        if(driveType === 'google-drive' || driveType === 'onedrive'){
            drive.initialize()
            token = await drive.checkIfTokenExpired(token, userEmail, driveEmail)  
        }

        responseObj = createJsonResponse('token_get_success', token.access_token)
        res.status(200).send(responseObj)

    }  
}

module.exports = router;
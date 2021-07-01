import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { getTokenFromDatabase } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.post('/createFolder', authorizeRoute, function(req, res, next) {

    const { parentId, driveEmail, driveType, path } = req.body
    let drive;

    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'):        
           
            switch(driveType){
                case "google-drive":
                    drive = new GoogleDriveHandler()
                    /* createGoogleFolder(res, req.email, driveEmail, driveType, parentId) */
                    break

                case "dropbox":
                    drive = new DropboxHandler()
                    /* createDropboxFolder(res, req.email, driveEmail, driveType, path) */
                    break
                
                case "onedrive":
                    drive = new OneDriveHandler()
                    /* createOnedriveFolder(res, req.email, driveEmail, driveType, parentId) */
                    break
                
                case "aio-drive":
                    drive = new AioDriveHandler()
                    createVirtualFolder(drive, req.email, parentId, res)
                    return
            }
 
            break
    }

    createFolder(drive, req.email, res, driveEmail, driveType, parentId, path)
  
});

async function createVirtualFolder(drive, userEmail, parentId, res) {
    const response = await drive.createFolder(userEmail, parentId).catch(err => {console.log(err)})
    if(response.response === 'OK'){
        res.status(200).send(response.folderObj)
    }else{
        res.sendStatus(500)
    }
}

async function createFolder(drive, userEmail, res, driveEmail, driveType, parentId, path){
    let responseObj;

    let token = await getTokenFromDatabase(userEmail, driveEmail, driveType).catch(err => {
        console.log(err)
        responseObj = createJsonResponse('create_folder_failed', "Couldn't fetch drive token from database")
        res.status(500).send(responseObj)
    })

    if(driveType === 'onedrive'){
        token = await drive.checkIfTokenExpired(token, userEmail, driveEmail)
    }

    if(token){
        drive.initialize()
        await drive.setToken(token).catch(err => {console.log(err)})
        const responseFileInfo = await drive.createFolder({parentId, path, driveEmail, token}).catch(err => console.log(err))
        if(responseFileInfo){
            responseObj = createJsonResponse('create_folder_success', responseFileInfo)
            res.status(200).send(responseObj)
        }
    }
}

module.exports = router;

import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { getTokenFromDatabase } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.post('/shareFile', authorizeRoute, function(req, res) {
    let drive;
    const { fileId, fileName, driveEmail, driveType, path, sharedWithEmail } = req.body
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'):  
            switch(driveType){
                case 'google-drive':
                    drive = new GoogleDriveHandler()
                    break

                case 'dropbox':
                    drive = new DropboxHandler()
                    break

                case 'onedrive':
                    drive = new OneDriveHandler()
                    break
                
                case 'aio-drive':
                    drive = new AioDriveHandler()
                    shareVirtualFolder(res, drive, fileId, req.email, sharedWithEmail)
                    return
            }  
            toggleSharing('enable', drive, res, req.email, fileId, fileName, driveEmail, driveType, path, null)
            break
    }
  
});

router.delete('/shareFile', authorizeRoute, function(req, res, next) {
    let drive;
    const { fileId, fileName, driveEmail, driveType, path, sharedLink, sharedWithEmail } = req.body
    
     switch(res.locals.responseObj.resType){
         case('no_token'):
         case('invalid_token'):
             res.status(401).send(res.locals.responseObj)
            break
         case('valid_token'):
         switch(driveType){
            case 'google-drive':
                drive = new GoogleDriveHandler()
                break

            case 'dropbox':
                drive = new DropboxHandler()
                break

            case 'onedrive':
                drive = new OneDriveHandler()
                break
            
            case 'aio-drive':
                drive = new AioDriveHandler()
                unshareVirtualFolder(res, drive, fileId, req.email, sharedWithEmail )
                return
        }  

        toggleSharing('disable', drive, res, req.email, fileId, fileName, driveEmail, driveType, path, sharedLink)

        break
    }
   
});

async function unshareVirtualFolder(res, drive, fileId, userEmail, sharedWithEmail){
    const response = await drive.unshareVirtualFolder(fileId, userEmail, sharedWithEmail)
    if(response === 'OK'){
        res.status(200).send('OK')
    }else{
        res.status(500).send('Something went wrong with sharing the virtual folder')
    } 
}

async function shareVirtualFolder (res, drive, fileId, userEmail, sharedWithEmail){
    const response = await drive.shareVirtualFolder(fileId, userEmail, sharedWithEmail)
    if(response === 'OK'){
        res.status(200).send('OK')
    }else{
        res.status(500).send('Something went wrong with sharing the virtual folder')
    }
}

export async function toggleSharing (toggleType, drive, res, userEmail, fileId, fileName, driveEmail, driveType, path, sharedLink){
    let responseObj, token, response;

    token = await getTokenFromDatabase(userEmail, driveEmail, driveType).catch(err => {
        console.log(err)
        responseObj = createJsonResponse('create_share_url_failed', "Couldn't fetch drive token from database")
        res.status(500).send(responseObj)
    })  

    if(driveType === 'onedrive'){
        token = await drive.checkIfTokenExpired(token, userEmail, driveEmail).catch(err => {console.log(err)})
 
    }
    
    drive.initialize()
    await drive.setToken(token).catch(err => {console.log(err)})
    if(toggleType === 'enable'){
        response = await drive.getShareUrl({fileId, path, fileName, fileId, token}).catch(err => {
            console.log(err)
            responseObj = createJsonResponse('create_share_url_failed', "Couldn't create share link for this file")
            res.status(500).send(responseObj)
        })
        if(response){ 
            res.status(200).send(response)
        }
    }else{
        response = await drive.disableSharing({fileId, sharedLink, token}).catch(err => {
            console.log(err)
            responseObj = createJsonResponse('disable_sharing_failed', err)
            res.status(500).send(responseObj)
        })

        if(response === 'OK'){
            res.status(200).send('OK')
        }
    }  
}

module.exports = {router, toggleSharing};
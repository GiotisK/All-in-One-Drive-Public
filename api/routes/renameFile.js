import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { getTokenFromDatabase, renameFileInVirtual } from '../src/utilities/MongoFunctions.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'

let router = express.Router();

router.post('/renameFile', authorizeRoute, function(req, res) {
    const { fileId, fileName, fileEmail, driveType, newName, path } = req.body //path is used for dropbox only
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
                    break

                case "dropbox":
                    drive = new DropboxHandler()
                    break

                case "onedrive":
                    drive = new OneDriveHandler()
                    break
                
                case 'aio-drive':
                    drive = new AioDriveHandler()
                    renameVirtualFile(drive, res, fileId, newName, req.email)
                    return
            }
            renameFile(drive, req.email, fileName, fileId, fileEmail, path, driveType, newName, res)
            renameFileInVirtual(fileId, newName, req.email)
        break
    }
  
});

async function renameVirtualFile(drive, res, fileId, newName, userEmail){
    const response = await drive.renameFile(fileId, newName, userEmail).catch(err=>{
        console.log(err)
        const responseObj = createJsonResponse('rename_file_failed', "Couldn't rename the file in the drive")
        res.status(500).send(responseObj)
    })
    if(response === 'OK'){
        res.status(200).send('OK')
    }

}

async function renameFile(drive, userEmail, fileName, fileId, driveEmail, path, driveType, newName, res){
    let responseObj;
    let token = await getTokenFromDatabase(userEmail, driveEmail, driveType).catch(err => {
        console.log(err)
        responseObj = createJsonResponse('rename_file_failed', "Couldn't fetch drive token from database")
        res.status(500).send(responseObj)
    })

    if(driveType === 'onedrive'){
        token = await drive.checkIfTokenExpired(token, userEmail, driveEmail)
    }
    
    drive.initialize()
    await drive.setToken(token).catch(err => {console.log(err)})
    if(token){
        const renameRes = await drive.renameFile({token, newName, oldName: fileName , userEmail, driveEmail, fileId, token, path})
        if(renameRes === 'OK'){
            res.status(200).send('OK')
        }else{
            responseObj = createJsonResponse('rename_file_failed', "Couldn't rename the file in the drive")
            res.status(500).send(responseObj)
        }
    }
}

module.exports = router;
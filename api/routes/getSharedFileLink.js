import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import { getTokenFromDatabase } from '../src/utilities/MongoFunctions.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'
import {toggleSharing} from '../routes/shareFile.js'

let router = express.Router();

router.post('/getSharedFileLink', authorizeRoute, async function(req, res, next) {
    console.log(req.body)
    const { driveEmail, fileId } = req.body
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break

        case('valid_token'):        
            getSharedUserAccessToken(res, req.email, fileId, driveEmail)   

        break
    }

})

async function getSharedUserAccessToken(res, userEmail, fileId, driveEmail){
    
    if(driveEmail !== userEmail){// case: accessing shared file
        const aio = new AioDriveHandler()
        const [response, file] = await aio.findSharedFileMetadata(fileId, driveEmail).catch(err=>{
            console.log(err)
        })
        
        if(response === 'OK'){

            let drive;
            switch(file.drive){
                case 'google-drive':
                    drive = new GoogleDriveHandler()
                    break

                case 'dropbox':
                    drive = new DropboxHandler()
                    break

                case 'onedrive':
                    drive = new OneDriveHandler()
                    break
            }
            /* console.log(file.permissionIds) */
            // await toggleSharing('disable', drive, res, driveEmail, fileId, file.name, file.email, file.drive, file.path, file.permissionIds[0])
            if(file.drive === 'dropbox'){
                const existingSharedLink = await handleDropboxExistingSharedLink(drive, driveEmail, file.email, file.id)
                if(existingSharedLink !== 'not exists'){
                    res.status(200).send(existingSharedLink)
                    
                }else{
                    await toggleSharing('enable', drive, res, driveEmail, fileId, file.name, file.email, file.drive, file.path, null)
                }
            }else{
                await toggleSharing('enable', drive, res, driveEmail, fileId, file.name, file.email, file.drive, file.path, null)
            }
        }else{
            res.status(500).send('')
        }
    }
}

async function handleDropboxExistingSharedLink(drive, userEmail, driveEmail, fileId){
    const token = await getTokenFromDatabase(userEmail, driveEmail, 'dropbox').catch(err => {
        console.log(err)
    }) 
    drive.initialize()
    await drive.setToken(token).catch(err => {console.log(err)})
    const existingSharedLink = await drive.getExistingSharedLink(fileId)
    return existingSharedLink
}

module.exports = router;
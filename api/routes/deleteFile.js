import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OnedriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { getTokenFromDatabase, deleteFileFromVirtual } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.post('/deleteFile', authorizeRoute, async function(req, res, next) {
    const { fileId, fileName, fileEmail, driveType, path } = req.body
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
                    drive = new OnedriveHandler()
                    break
                
                case 'aio-drive':
                    drive = new AioDriveHandler()
                    deleteVirtualFolder(drive, res, fileId, req.email)
                    return
            }
            break
    }
    deleteFile(drive, req.email, fileEmail, fileId, fileName, path, driveType, res)
    deleteFileFromVirtual(fileId, req.email).catch(err => {return})
});

async function deleteVirtualFolder(drive, res, fileId, userEmail){
    const deletedFiles = await drive.deleteFile(fileId, userEmail).catch(err=>{
        console.log(err)
    })
    if(deletedFiles){
        res.status(200).send('OK')
    }
    /* console.log(deletedFiles) */
    await deleteVirtualFolderContentsFromTheirDrives('google-drive', deletedFiles['google-drive'])
    await deleteVirtualFolderContentsFromTheirDrives('dropbox', deletedFiles['dropbox'])
    await deleteVirtualFolderContentsFromTheirDrives('onedrive', deletedFiles['onedrive'])
    /* if(response === 'OK'){
        res.status(200).send('OK')
    } */
}

function deleteVirtualFolderContentsFromTheirDrives(driveType, files){
    return new Promise(async (resolve, reject) => {
        let drive, token, i;

        switch(driveType){
            case 'google-drive':
                drive = new GoogleDriveHandler()
                break

            case 'dropbox':
                drive = new DropboxHandler()
                break

            case 'onedrive':
                drive = new OnedriveHandler()
                break
        }
        for(i=0; i<files.length; i++){
            //check if drive changed cause u need to set the new token

            token = await getTokenFromDatabase(files[i].aioDriveEmail, files[i].email, driveType).catch(err => {
                console.log(err)
                responseObj = createJsonResponse('delete_file_failed', "Couldn't fetch drive token from database")
                res.status(500).send(responseObj)
            })

            if(driveType === 'onedrive'){
                token = await drive.checkIfTokenExpired(token, files[i].aioDriveEmail, files[i].email)
            }
            
            if(token){

                if(driveType === 'google-drive' || driveType === 'dropbox'){
                    drive.initialize()
                    await drive.setToken(token).catch(err => {console.log(err)})
                }
                const deleteRes = await drive.deleteFile({fileId: files[i].id, token, path: files[i].path, fileName: files[i].name}).catch(err => {console.log(err)})
        
                if(deleteRes === 'OK'){
                    console.log(`file ${files[i].name} was deleted OK`)
                }else{
                    console.log(`file ${files[i].name} WASNT deleted`)
                }
            }
        }
        resolve()
    })
}



async function deleteFile(drive, userEmail, driveEmail, fileId, fileName, path, driveType, res){
    let responseObj;
    let token = await getTokenFromDatabase(userEmail, driveEmail, driveType).catch(err => {
        console.log(err)
        responseObj = createJsonResponse('delete_file_failed', "Couldn't fetch drive token from database")
        res.status(500).send(responseObj)
    })
 
    if(driveType === 'onedrive'){
        token = await drive.checkIfTokenExpired(token, userEmail, driveEmail)
    }

    if(token){
        if(driveType === 'google-drive' || driveType === 'dropbox'){
            drive.initialize()
            await drive.setToken(token).catch(err => {console.log(err)})
        }
   
        const deleteRes = await drive.deleteFile({fileId, token, path, fileName}).catch(err => {console.log(err)})

        if(deleteRes === 'OK'){
            res.status(200).send('OK')
        }else{
            responseObj = createJsonResponse('delete_file_failed', "Couldn't delete the file from drive")
            res.status(500).send(responseObj)
        }
    }
}

module.exports = router;
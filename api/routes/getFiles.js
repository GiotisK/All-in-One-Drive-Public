import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { 
    getTokenFromDatabase, 
    getAllUserTokensFromDatabase, 
} from '../src/utilities/MongoFunctions.js'


let router = express.Router();

router.post('/getFiles', authorizeRoute, function(req, res, next) {
    const { folderId, folderDrive, folderEmail, folderName, path } = req.body
    let drive;
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'): 
            switch(folderDrive){
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
                    break
            }  

            if(folderId && folderDrive !== 'aio-drive'){
                fetchFolderContents(drive, res, req.email, folderId, folderDrive, folderEmail, folderName, path)
            }else if(folderId === undefined && folderDrive !== 'aio-drive'){
                fetchFilesFromDrives(req.email, res)
            }else{
                fetchFilesFromVirtualDrive(drive, req.email, folderId, folderName, folderEmail, res)
            }
            break
    }
  
});


async function fetchFilesFromVirtualDrive(drive, userEmail, folderId, folderName, folderEmail, res){
    let responseObj;

    const files = await drive.getFiles(folderId, userEmail, folderEmail, folderName).catch(err=>{
        console.log(err)
        /* res.status(500).send('Something went wrong with fetching virtual files') */
        return
    })
    if(folderId === undefined){
        responseObj = createJsonResponse('get_files_success', [files, []])
        res.status(200).send(responseObj)
    }else{
        responseObj = createJsonResponse('get_files_success', files)
        res.status(200).send(responseObj)
    }
    

}

async function fetchFolderContents(drive, res, userEmail, folderId, folderDrive, folderEmail, folderName, path){
    let responseObj;

    let token = await getTokenFromDatabase(userEmail, folderEmail, folderDrive)
    if(folderDrive === 'onedrive'){
        token = await drive.checkIfTokenExpired(token, userEmail, folderEmail)
    }

    drive.initialize()
    drive.setToken(token)

    drive.getFiles({type: 'folder_contents', folderId, driveEmail: folderEmail, folderName, path, token}).then((folderFiles)=> {
        responseObj = createJsonResponse('folder_contents_fetch_success', folderFiles)
        res.status(200).send(responseObj)
    }).catch(err=>{
        console.log(err)
        responseObj = createJsonResponse('folder_contents_fetch_failed', folderDrive)
        res.status(500).send(responseObj)
    })
}

async function fetchFilesFromDrives(userEmail, res) {
    let i, responseObj, filesAndDriveObj;
    let allDrivesFiles = []
    let allDrives = []

    const drives = {
        'google-drive': new GoogleDriveHandler(),
        'dropbox': new DropboxHandler(),
        'onedrive': new OneDriveHandler()
    }
    const driveObjs = {
        'google-drive': [],
        'dropbox': [],
        'onedrive': []
    }

    for(const driveType in driveObjs){
        driveObjs[driveType] = await getAllUserTokensFromDatabase(userEmail, driveType).catch(err => {
            responseObj = createJsonResponse('get_files_failed', "Couldn't fetch drive token from database")
            res.status(500).send(responseObj)
        })
        const driveCount = driveObjs[driveType].length

        for(i=0; i<driveCount; i++){
            filesAndDriveObj = await getDriveFiles(drives[driveType], driveType, driveObjs[driveType][i], userEmail/* driveObjs[driveType][i].email */ ).catch(err => {
            
                responseObj = createJsonResponse('get_files failed', "Couldn't fetch files from drive")
                res.status(500).send(responseObj)
                return
            })
            allDrivesFiles = [...allDrivesFiles, ...filesAndDriveObj.files]
            allDrives = [...allDrives, ...filesAndDriveObj.drive]
        }
    }

    responseObj = createJsonResponse('get_files_success', [allDrivesFiles, allDrives])
    res.status(200).send(responseObj)
} 

function getDriveFiles(drive, driveType, driveObj, userEmail) {

    return new Promise(async (resolve, reject) => {
        let token = JSON.parse(driveObj.token)

        if(driveType === 'onedrive'){
            token = await drive.checkIfTokenExpired(token, userEmail, driveObj.email)
        }
        
        drive.initialize()
        await drive.setToken(token).catch(err => {console.log(err); reject(err)})
        const driveInfo = await drive.getDriveInfo({token, email: driveObj.email})
        const files = await drive.getFiles({token, driveEmail: driveObj.email, type: 'root_files', folderId: '', folderName: '', path: ''}).catch(err => {
            console.log(err)
        })

        if(files){
            resolve({files: files, drive: [driveInfo]}) //drive needs to be set as array to be spread-able
        }else{
            reject("Couldn't fetch files from drive")
        }
    })
}

module.exports = router;
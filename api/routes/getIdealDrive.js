import express from 'express'
import fs from 'fs'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { 
    getAllUserTokensFromDatabase,  
    setFileMetadataFromDatabase 
} from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.post('/getIdealDrive', authorizeRoute, function(req, res, next) {
    let { fileSize } = req.body
    fileSize = calculateSizeInGB(fileSize)
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'): 
           findIdealDriveForUpload(res, req.email, fileSize)
        break
    }
  
});

async function findIdealDriveForUpload(res, userEmail, fileSize){
    let quotaObjects = {
        'google-drive': [],
        'dropbox': [],
        'onedrive': []
    }
    let responseObj, token;
    let percentageObjs = []
    let driveInfos = []

    for(const driveType in quotaObjects){
        const driveObjs = await getAllUserTokensFromDatabase(userEmail, driveType).catch(err => {
            console.log(err)
            responseObj = createJsonResponse('get_ideal_drive_failed', err)
            res.status(500).send(responseObj)
        })
        const driveCount = driveObjs.length
        const drive = createDriveClass(driveType)

        for(let i=0; i<driveCount; i++){
            let {aiofolder_id, email} = driveObjs[i]
            token = driveObjs[i].token
            token = JSON.parse(token)

            if(driveType === 'onedrive'){
                token = await drive.checkIfTokenExpired(token, userEmail, driveObjs[i].email)
            }
            
            drive.initialize()
            await drive.setToken(token).catch(err => {console.log(err); reject(err)})
            const driveInfo = await drive.getDriveInfo({token, email: driveObjs[i].email}, false).catch(err => {
                console.log(err)
            })
            driveInfo.driveClassObj = drive
            driveInfo.aiofolder_id = aiofolder_id
            driveInfo.token = token
            driveInfos.push(driveInfo)
            const percentage = calculateFreeQuotaPercentage(driveInfo.quota, fileSize)
            if(percentage >= 0){
                percentageObjs.push({
                    email: email,
                    driveType: driveType,
                    quotaPercentage: percentage,
                    aiofolder_id: aiofolder_id
                })
            }

        }
    }

    if(percentageObjs.length > 0){
        let max = -999
        let idealDriveObj = {}
        for(var i=0; i< percentageObjs.length; i++){
            if(percentageObjs[i].quotaPercentage > max){
                max = percentageObjs[i].quotaPercentage
                idealDriveObj = percentageObjs[i]
            }
        }

        //--TEST CASE STEP 1--
        //idealDriveObj.quotaPercentage = -1  //this means there is external fragmentation
        if(idealDriveObj.quotaPercentage === -1){
            const defragable = await manageDriveQuotas(driveInfos, fileSize, userEmail)
            if(defragable === true) {
                res.status(200).send(idealDriveObj)
            }else{
                res.status(500).send({}) //cant defrag
            }
        }else{
            res.status(200).send(idealDriveObj)
        }
        
    }else{
        res.status(500).send({}) //no drives connected
    }
   
}

function manageDriveQuotas(driveInfos, fileSize, userEmail){
    return new Promise(async (resolve, reject) => {

        let maxFree = 0
        let maxIndex;

        for(let i=0; i<driveInfos.length; i++){
            let [allocated, total] = driveInfos[i].quota.split('/')
            allocated = parseFloat(allocated.trim())
            total = parseFloat(total.trim())
            const free = (total*Math.pow(1024, 3)) - (allocated*Math.pow(1024, 3))
            driveInfos[i].freeQuota = free
            if(free > maxFree){
                maxFree = free
                maxIndex = i
            }
        }

        
        let files = await driveInfos[maxIndex].driveClassObj.getFiles(
            {
                type:'folder_contents', 
                folderId: driveInfos[maxIndex].aiofolder_id, 
                driveEmail: driveInfos[maxIndex].email,
                folderName: 'aio drive',
                path: '/',
                token: driveInfos[maxIndex].token
            }
        ).catch(err => {console.log(err)})

        
        let filesForMove = []
        //---TEST CASE STEP 2
        //driveInfos[maxIndex].freeQuota = 2097152//set the freequota as 2MB fake 
        //fileSize = 3145728 //set the size of the new file as 3MB fake
        //that means we need 1 more MB to move
        /*--------------------------------------*/
        // FIRST CHECK IF FREE SPACE EXISTS
        for(let i=0; i<files.length; i++){
            for(let j=0; j<driveInfos.length; j++){
                if(j !== maxIndex){ //exclude the max quota drive
                    if(files[i].size <= driveInfos[j].freeQuota && files[i].type === 'file'){ //check if file fits in the other drives
                        driveInfos[j].freeQuota -= +files[i].size //decrement the quota of the drive u are going to move the file to
                        driveInfos[maxIndex].freeQuota += +files[i].size //if fits, increment the quota of "maxfreequota drive"
                        filesForMove.push({file: files[i], toDrive: driveInfos[j]})
                        if(driveInfos[maxIndex].freeQuota >= fileSize){ //check now if it fits after the moving
                            await moveFilesBetweenDrives(driveInfos, filesForMove, maxIndex, userEmail) //if it fits, move files and return
                            resolve(true)
                            return;
                            
                        }
                        
                        break;// if u enter the top if statement, means that file is going to be assigned to a new drive. S
                    }

                }
            }
        }
        resolve(false)
    })
}

function moveFilesBetweenDrives(driveInfos, filesForMove, maxIndex, userEmail) {
    console.log(filesForMove)
    return new Promise(async (resolve, reject) => {
        for(let i=0; i<filesForMove.length; i++){
            const toDrive = filesForMove[i].toDrive.driveClassObj
            const toDriveEmail = filesForMove[i].toDrive.email
            const toDriveAioFolderId = filesForMove[i].toDrive.aiofolder_id
            const token = filesForMove[i].toDrive.token
            await driveInfos[maxIndex].driveClassObj.downloadFile({fileId: filesForMove[i].file.id, name: filesForMove[i].file.name, path:'/aio drive/', token: driveInfos[maxIndex].token}) // download file
            await driveInfos[maxIndex].driveClassObj.deleteFile({fileId: filesForMove[i].file.id, token: driveInfos[maxIndex].token, path:'/aio drive/', fileName: filesForMove[i].file.name}).catch(err => {console.log(err)})
            const newFileMetadata = await toDrive.uploadFile({name: filesForMove[i].file.name, aiofolder_id: toDriveAioFolderId, token, path:'/aio drive/', driveEmail: toDriveEmail})
            await setFileMetadataFromDatabase(userEmail, filesForMove[i].file.id, newFileMetadata).catch(err => console.log(err))
            deleteFileFromDownloads(filesForMove[i].file.name)
        }
        resolve()
    })
}

function deleteFileFromDownloads(name){
    fs.unlink('./downloads/'+ name, (err) => {
        if(err){
            console.log(err)
            return
        }else{
            console.log('success')
        }
    })
}

function calculateFreeQuotaPercentage(quotaObj, fileSize){
    let [allocated, total] = quotaObj.split('/')
    total = total.trim()
    allocated = allocated.trim()
    if(total === '∞'){
        return 0.0
    }else{
        allocated = parseFloat(allocated)
        total = parseFloat(total)
        const free = total-allocated
        if(free > fileSize){
            return(free)
        }else{
            return -1
        }
    }  
}

function calculateSizeInGB(fileSize) {
    return (fileSize / Math.pow(2, 30))
}

function createDriveClass(driveType){
    let drive;
    switch(driveType){
        case 'dropbox':
            drive = new DropboxHandler()
            break

        case 'google-drive':
            drive = new GoogleDriveHandler()
            break

        case 'onedrive':
            drive = new OneDriveHandler()
            break
    }
    return drive
}

module.exports = router;
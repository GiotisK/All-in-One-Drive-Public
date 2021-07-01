import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import { getAllUserTokensFromDatabase } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.get('/getVirtualQuota', authorizeRoute, function(req, res) { 
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'): 
           calculateVirtualQuota(res, req.email)
        break
    }
})

async function calculateVirtualQuota(res, userEmail) {
    let totalAllocated = 0
    let totalFree = 0
    let infiniteQuotaFound = false
    const driveTypes = ['google-drive', 'dropbox', 'onedrive']

    for(const driveType of driveTypes){

        const driveObjs = await getAllUserTokensFromDatabase(userEmail, driveType).catch(err => {
            console.log(err)
            responseObj = createJsonResponse('get_ideal_drive_failed', err)
            res.status(500).send(responseObj)
        })

        const driveCount = driveObjs.length
        const drive = createDriveClass(driveType)

        for(let i=0; i<driveCount; i++){
            let {token, aiofolder_id, email} = driveObjs[i]
            token = JSON.parse(token)

            if(driveType === 'onedrive'){
                token = await drive.checkIfTokenExpired(token, userEmail, driveObjs[i].email)
            }
            drive.initialize()
            await drive.setToken(token).catch(err => {console.log(err); reject(err)})
            const driveInfo = await drive.getDriveInfo({token, email: email}).catch(err => {
                console.log(err)
            })
     
            const [allocated, free] = driveInfo.quota.split('/')

            if(free.trim() === '∞'){
                totalFree = '∞'
                infiniteQuotaFound = true
            }

            if(infiniteQuotaFound === false){
                totalFree += parseFloat(free)
            }
            totalAllocated += parseFloat(allocated)
            

        }
    }

    res.status(200).send(`${totalAllocated.toFixed(2)} / ${totalFree} GB`)
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
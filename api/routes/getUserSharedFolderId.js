import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import AioDriveHandler from '../src/drive-handlers/AioDriveHandler.js'

let router = express.Router();

router.get('/getUserSharedFolderId', authorizeRoute, async function(req, res, next) {
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break

        case('valid_token'):        
            getUserSharedFolderId(res, req.email)
        break
    }
})

async function getUserSharedFolderId(res, driveEmail){
    const drive = new AioDriveHandler()
    const userShareFolderId = await drive.getUserSharedFolderId(driveEmail)
    if(userShareFolderId){
        res.status(200).send(userShareFolderId)
    }else{
        res.status(500).send('')
    }
}


module.exports = router
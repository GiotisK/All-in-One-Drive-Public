import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import {getTokenFromDatabase} from '../src/utilities/MongoFunctions.js'
import User from '../src/utilities/User.js'

let router = express.Router();

router.post('/deleteDrive', authorizeRoute, function(req, res, next) {
    const { driveType, driveEmail } = req.body

    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'):        
            deleteDriveFromDatabase(req.email, driveType, driveEmail, res)
            break
    }
  
});

async function deleteDriveFromDatabase(userEmail, driveType, driveEmail, res) {
   
    await deleteAioFolder(userEmail, driveEmail, driveType)

    const updateRes = await User.updateOne({email: userEmail}, {$pull: {[driveType]: {"email": driveEmail} } })

    if(updateRes.nModified === 1){

        res.status(200).send('OK')
    }else{
        const responseObj = createJsonResponse('delete_drive_failed', '')
        res.status(500).send(responseObj)
    }

    
}

async function deleteAioFolder(userEmail, driveEmail, driveType) {
    let token = await getTokenFromDatabase(userEmail, driveEmail, driveType)
    const drive = createDriveClass(driveType)
    if(driveType === 'onedrive'){
        token = await drive.checkIfTokenExpired(token, userEmail, driveEmail)
    }

    drive.initialize()
    drive.setToken(token)

    const user = await User.findOne({email: userEmail})
    let aiofolder_id;
    for(let i=0; i<user[driveType].length; i++){
        
        if(user[driveType][i].email === driveEmail){
            
            aiofolder_id = user[driveType][i].aiofolder_id
            const res = await drive.deleteFile({fileId: aiofolder_id, token, path:'/', fileName: 'aio drive'})

            return
        }
    }
    
    
}

function createDriveClass(driveType){
    switch(driveType){
        case 'google-drive':
            return new GoogleDriveHandler()

        case 'onedrive':
            return new OneDriveHandler()

        case 'dropbox':
            return new DropboxHandler()
    }
}

module.exports = router;
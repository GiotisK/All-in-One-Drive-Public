import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import { addTokenToDatabase } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

/*first check if valid request from authenticated user,
then we get the code after user redirect in the front end,
then we make sure this user exists in the mongoDB,
after that, we set that code in the user object in the database !
*/

router.post('/authenticateDrive', authorizeRoute, function(req, res, next) {
    const {authCode, driveType} = req.body 

    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'):
            let drive;
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
            }
            generateToken(drive,authCode, req.email, driveType, res)
                 
            break
    }
  
});

async function generateToken(drive, authCode, userEmail, driveType, res){
    drive.initialize()
    let token = await drive.generateToken(authCode).catch(err => {console.log(err)})
    if(driveType === 'google-drive'){
        await drive.setToken(token).catch(err=>{console.log(err)})
    }
    const driveEmail = await drive.getDriveEmail(token.access_token).catch(err => {console.log(err)})
    const folderMetadata = await drive.createFolder({parentId: '', path: '', driveEmail, token, folderName: 'aio drive'}).catch(err => console.log(err))

    if(driveEmail){
        addTokenToDatabase(token, driveEmail, driveType,  userEmail, res, folderMetadata.id)
    }
    return
}

module.exports = router;
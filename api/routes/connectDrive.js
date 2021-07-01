import express from 'express'
import GoogleDriveHandler from '../src/drive-handlers/GoogleDriveHandler.js'
import DropboxHandler from '../src/drive-handlers/DropboxHandler.js'
import OneDriveHandler from '../src/drive-handlers/OneDriveHandler.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'

let router = express.Router();

router.get('/connectDrive/:id', async function(req, res) {
    let drive;
    switch(req.params.id){
        case('googledrive'):
            drive = new GoogleDriveHandler()
            break

        case('dropbox'):
            drive = new DropboxHandler()
            break

        case('onedrive'):
            drive = new OneDriveHandler()
            break

        default:
            const responseObj = createJsonResponse('invalid_drivetype', req.params.id)
            res.status(404).send(responseObj)
    }
    getAuthUrl(drive, res)
 
});

async function getAuthUrl(drive, res){
    drive.initialize()
    const authUrl = await drive.authorize()
    res.status(200).send(authUrl)
}

module.exports = router;
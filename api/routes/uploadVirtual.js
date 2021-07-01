import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'
import { pushFileToDatabase } from '../src/utilities/MongoFunctions.js'

let router = express.Router();

router.post('/uploadVirtual', authorizeRoute, async function(req, res) {
    const { fileMetadata } = req.body //path is used for dropbox only
    switch(res.locals.responseObj.resType){
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break

        case('valid_token'):
           const response = await pushFileToDatabase(req.email, fileMetadata)
           if(response === 'OK'){
                res.status(200).send('OK')
           }else{
                res.status(500).send('Something went wrong')
           }
        break
    }
})

module.exports = router;
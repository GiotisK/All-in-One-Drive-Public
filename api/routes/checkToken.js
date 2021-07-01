import express from 'express'
import authorizeRoute from '../src/utilities/middleware.js'

let router = express.Router();

router.get('/checkToken', authorizeRoute, function(req, res) {

    switch(res.locals.responseObj.resType){
        
        case('no_token'):
        case('invalid_token'):
            res.status(401).send(res.locals.responseObj)
            break
        case('valid_token'):
            res.status(200).send(res.locals.responseObj);
            break
    }
});

module.exports = router;
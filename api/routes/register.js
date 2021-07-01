
import express from 'express'
import User from '../src/utilities/User.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
let router = express.Router();

router.post('/register', function(req, res, next) {
    const { email, password } = req.body;
    const user = new User({ email, password });
    user.virtualdrive.folders[0].email = email

    let responseObj = {}

    user.save(function(err) {
        if (err) {    
            responseObj = createJsonResponse(err.code, err.errmsg)
            res.status(500).send(responseObj);
            
        } else {
            responseObj = createJsonResponse('register_success', '')
            res.status(200).send(responseObj);
        }
    });
});

module.exports = router;

import express from 'express'
import User from '../src/utilities/User.js'
import createJsonResponse from '../src/utilities/ResponseMaker.js'
import jwt from 'jsonwebtoken'

let router = express.Router();

router.post('/login' , function(req, res, next) {
    const { email, password } = req.body;
    let responseObj = {}

    User.findOne({ email }, function(err, user) {
        
        if (err) {
            responseObj = createJsonResponse('search_failed', err.errmsg)
            res.status(500).send(responseObj)
        } else if (!user) {
            responseObj = createJsonResponse('user_not_exists', '')
            res.status(401).send(responseObj)
        } else {
            user.isCorrectPassword(password, function(err, same) {
                if (err) {
                    responseObj = createJsonResponse('compare_passwords_failed', err.errmsg)
                    res.status(500).send(responseObj)
                } else if (!same) {
                    responseObj = createJsonResponse('user_not_exists', '')
                    res.status(401).send(responseObj)
                } else {
                    // Issue token
                    const secret = process.env.JWT_SECRET
                    const payload = { email };
                    const token = jwt.sign(payload, secret, {
                        expiresIn: '9999 years'
                    });
                    responseObj = createJsonResponse('login_success', '')
                    res.cookie('token', token, { httpOnly: true }).status(200).send(responseObj)
                                    
                }
            });
        }
    });
});

module.exports = router;
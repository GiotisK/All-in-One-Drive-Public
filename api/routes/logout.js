import express from 'express'
import createJsonResponse from '../src/utilities/ResponseMaker.js'

let router = express.Router();

router.post('/logout', function(req, res, next) {
    let responseObj = createJsonResponse('logout_success')
    res.clearCookie('token').status(200).send(responseObj)
});

module.exports = router;
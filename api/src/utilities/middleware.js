import jwt from 'jsonwebtoken'
import createJsonResponse from './ResponseMaker.js'

export default function(req, res, next) {
    const secret = process.env.JWT_SECRET;
    const token = req.cookies.token;
    let responseObj = {}

    if (!token) {
        responseObj = createJsonResponse('no_token')
        res.locals.responseObj = responseObj
    } else {

        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                responseObj = createJsonResponse('invalid_token')
            } else {
                req.email = decoded.email;//this not needed maybe
                responseObj = createJsonResponse('valid_token', decoded.email)    
            }
        });
    }
    res.locals.responseObj = responseObj
    next();
}
const DUPLICATE_EMAIL_ERROR_CODE = '11000'

export default function createJsonResponse(str, info) {
    str = str.toString()
    let responseObj = {}

    switch(str) {
        
        case DUPLICATE_EMAIL_ERROR_CODE: 
            responseObj = {
                resType: 'duplicate_email',
                resMsg: 'duplicate email address',
                resInfo: info
            }
            break

        case 'register_success':
            responseObj = {
                resType: 'register_success',
                resMsg: 'register success',
                resInfo: 'User has registered successfully'
            }
            break

        case 'login_success':
            responseObj = {
                resType: 'login_success',
                resMsg: 'login success',
                resInfo: 'User has logged in successfully'
            }
            break

        case 'logout_success':
            responseObj = {
                resType: 'logout_success',
                resMsg: 'logout success',
                resInfo: 'User has logged out successfully'
            }
            break

        case 'search_failed':
            responseObj = {
                resType: 'search_failed',
                resMsg: 'findOne() failed failed to get called',
                resInfo: info
            }
            break
        
        case 'compare_passwords_failed':
            responseObj = {
                resType: 'compare_passwords_failed',
                resMsg: 'isCorrectPassword() failed to get called',
                resInfo: info
            }
            break

        case 'user_not_exists':
            responseObj = {
                resType: 'user_not_exists',
                resMsg: 'user not found',
                resInfo: 'Wrong combination of email/password'
            }
            break
        
        case 'no_token':
            responseObj = {
                resType: 'no_token',
                resMsg: 'Unauthorized: No token provided',
                resInfo: 'User must be authorized to visit this route'
            }
            break

        case 'invalid_token':
            responseObj = {
                resType: 'invalid_token',
                resMsg: 'Unauthorized: Invalid token',
                resInfo: 'User must be authorized to visit this route'
            }
            break
        
        case 'valid_token':
            responseObj = {
                resType: 'valid_token',
                resMsg: 'Authorized: valid token',
                resInfo: info
            }
            break

        case 'invalid_drivetype':
            responseObj = {
                resType: 'invalid_drivetype',
                resMsg: 'Not found: invalid drivetype',
                resInfo: `This drive type '${info}' is not valid`
            }
            break

        case 'drive_add_success':
            responseObj = {
                resType: 'drive_add_success',
                resMsg: 'drive add success',
                resInfo: `${info} was added successfully`
            }
            break

        case 'drive_update_success':
            responseObj = {
                resType: 'drive_update_success',
                resMsg: 'token drive update success',
                resInfo: `${info} token was updated successfully`
            }
            break
        
        case 'drive_add_failed':
            responseObj = {
                resType: 'drive_add_failed',
                resMsg: 'drive add failed',
                resInfo: `${info} was not added`
            }
            break

        case 'get_files_failed':
            responseObj = {
                resType: 'get_files_failed',
                resMsg: 'get files failed',
                resInfo: info
            }
            break

        case 'get_files_success':
            responseObj = {
                resType: 'get_files_success',
                resMsg: 'get files succeeded',
                resInfo: info
            }
            break

        case 'delete_file_failed':
            responseObj = {
                resType: 'delete_file_failed',
                resMsg: 'delete file failed',
                resInfo: info
            }
            break

        case 'rename_file_failed':
            responseObj = {
                resType: 'rename_file_failed',
                resMsg: 'rename file failed',
                resInfo: info
            }
            break

        case 'delete_drive_failed':
            responseObj = {
                resType: 'delete_drive_failed',
                resMsg: 'delete drive failed',
                resInfo: 'Failed to remove drive from this user`s schema'
            }
            break
        
        case 'token_get_success':
            responseObj = {
                resType: 'token_get_success',
                resMsg: 'token get successful',
                resInfo: info
            }
            break;

        case 'token_refresh_failed':
            responseObj = {
                resType: 'token_refresh_failed',
                resMsg: 'token refresh failed',
                resInfo: 'failed to refresh the token'
            }
            break;

        case 'refreshedToken_push_failed':
            responseObj = {
                resType: 'refreshedToken_push_failed',
                resMsg: 'refreshed token push failed',
                resInfo: 'failed to push the newly refreshed token in the database'
            }
            break

        case 'refreshedToken_push_success':
            responseObj = {
                resType: 'refreshedToken_push_success',
                resMsg: 'refreshed token push successful',
                resInfo: info
            }
            break
        
        case 'folder_contents_fetch_failed':
            responseObj = {
                resType: 'folder_contents_fetch_failed',
                resMsg: 'folder contents fetch failed',
                resInfo: `failed to fetch contents from ${info} folder`
            }
            break

        case 'folder_contents_fetch_success':
            responseObj = {
                resType: 'folder_contents_fetch_successful',
                resMsg: 'folder contents fetch successful',
                resInfo: info
            }
            break

        case 'create_share_url_failed':
            responseObj = {
                resType: 'create_share_url_failed',
                resMsg: 'create share url failed',
                resInfo: info
            }
            break
        
        case 'create_share_url_success':
            responseObj = {
                resType: 'create_share_url_success',
                resMsg: 'create share url successful',
                resInfo: info
            }
            break
        
        case 'disable_sharing_failed':
            responseObj = {
                resType: 'disable_sharing_failed',
                resMsg: 'disable sharing failed',
                resInfo: info
            }
            break
        
        case 'create_folder_failed':
            responseObj = {
                resType: 'create_folder_failed',
                resMsg: 'create folder failed',
                resInfo: info
            }
            break

        case 'create_folder_success':
            responseObj = {
                resType: 'create_folder_success',
                resMsg: 'create folder successful',
                resInfo: info
            }
            break
        
        case 'get_ideal_drive_failed':
            responseObj = {
                resType: 'get_ideal_drive_failed',
                resMsg: 'get ideal drive failed',
                resInfo: info
            }
            break
                
        
    }
    return responseObj
}
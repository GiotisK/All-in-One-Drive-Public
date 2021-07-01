

export const myFetch = (route, type, body) => {

    return new Promise((resolve, reject) => {
        if(type === 'POST'){
            fetch("http://localhost:9000/"+route, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'include', //CARE: maybe 'include' is needed if you want to signup for example from a different browser than the developer's browser
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: body
            })
            .then(res => res.text())
            .then(res => {
                resolve(res)
            } )
            .catch(err => {reject(err)})
        }else{

            fetch("http://localhost:9000/"+route, {
                    method: type,
                    credentials: 'include', //CARE: maybe 'include' is needed if you want to signup for example from a different browser than the developer's browser
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: body
                })
            .then(res => res.text())
            .then(res => {       
                resolve(res)
            })
            .catch(err => {
                reject(err)
            });
        }
       
    })
    
}

export const parseUrlCode = (code) => {
    if(code.includes('google')){
        code = code.replace('?code=','')
        code = code.replace('&scope=https://www.googleapis.com/auth/drive', '')
        return [code, 'google-drive']

    }else if(code.includes('dropbox')){
        code = code.replace('?driveType=dropbox', '')
        code = code.replace('&code=', '')
        return [code, 'dropbox']

    }else{//onedrive
        code = code.replace('?code=','')
        return [code, 'onedrive']
    }
}

export const getCurrentDate = () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    return(yyyy+'-'+mm+'-'+dd)
}

export const putExtraMetadataInFile = (responseFileInfo, driveForUpload) => {
    const SPLIT_LAST_DOT_REGEXP = /\.(?=[^\.]+$)/
    const [name, fileExtension] = responseFileInfo.name.split(SPLIT_LAST_DOT_REGEXP)
    responseFileInfo.extension = '.'+fileExtension
    responseFileInfo.type = 'file'
    responseFileInfo.email = driveForUpload.driveEmail
    responseFileInfo.drive = driveForUpload.driveType
    responseFileInfo.createdTime = getCurrentDate()

    return responseFileInfo
}

export const putExtraMetadataInFolder = (responseFileInfo, driveForUpload) => {
    responseFileInfo.extension = 'folder'
    responseFileInfo.type = 'folder'
    responseFileInfo.email = driveForUpload.driveEmail
    responseFileInfo.drive = driveForUpload.driveType
    responseFileInfo.createdTime = (responseFileInfo.drive === 'google-drive' ? getCurrentDate() : 'No date')
    responseFileInfo.permissionIds = ['']

    return responseFileInfo
}









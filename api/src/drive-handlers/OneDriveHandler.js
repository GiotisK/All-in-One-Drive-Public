import fetch from 'node-fetch'
import { pushRefreshedAccessTokenToDatabase } from '../utilities/MongoFunctions.js'
import fs from 'fs'

const SPLIT_LAST_DOT_REGEXP = /\.(?=[^\.]+$)/

export default class DropboxHandler {

    constructor() {
        this.credentials = JSON.parse(process.env.ONEDRIVE_CREDENTIALS)

        this.initialize = () => {
            return
            //empty for refactoring purposes
        }

        this.authorize = () => {
            const {redirect_uri, client_id, scope} = this.credentials
            return new Promise(async (resolve, reject) => {
                fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${client_id}&scope=${scope}&response_type=code&redirect_uri=${redirect_uri}`)
                .then(res => {
                    resolve(res.url)
                } )
                .catch(err => reject(err))
            })
        }

        this.generateToken = (code) => {
            const {redirect_uri, client_id, client_secret} = this.credentials

            return new Promise((resolve, reject) => {
                fetch("https://login.live.com/oauth20_token.srf", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `client_id=${client_id}&redirect_uri=${redirect_uri}&client_secret=${client_secret}&code=${code}&grant_type=authorization_code`
                })
                .then(res => res.text())
                .then(res => {
                    resolve(JSON.parse(res))
                }).catch(err => reject(err))
            })
        }

        this.setToken = async (token) => {
            return //empty for refactoring purposes
        }
       
        this.getDriveEmail = (accessToken) => {
            return new Promise((resolve, reject)=> {
                fetch("https://graph.microsoft.com/v1.0/users/me", {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type':	'application/json',
                    },
                })
                .then(res => res.text())
                .then(res => { 
                    res = JSON.parse(res)
                    resolve(res.userPrincipalName)
                })
                .catch(err => {
                    reject(err)
                });
            })       
        }

        this.checkIfTokenExpired = (token, userEmail, driveEmail) => {

            return new Promise(async (resolve, reject)=>{
                const hourInMilliSeconds = 3600000
                if(Date.now() - token.date > hourInMilliSeconds){

                    const newToken = await this.refreshToken(token.refresh_token).catch(err => {
                        console.log(err)
                        reject(err)
                        return
                    })
                    const response = await pushRefreshedAccessTokenToDatabase(newToken, userEmail, driveEmail, 'onedrive').catch(err => {
                        console.log(err)
                        reject(err)
                        return
                    })

                    
                    if(response === 'OK'){
                        resolve(newToken)
                    }else{
                        resolve('err pushing refreshed access token to database')
                    }

                    
                }else{
                    resolve(token)
                }
            })
        }

        this.refreshToken = (refreshToken) => {
            const {redirect_uri, client_id, client_secret, scope} = this.credentials

            return new Promise((resolve, reject) => {
                fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'include', //CARE: maybe 'include' is needed if you want to signup for example from a different browser than the developer's browser
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer',
                    body: `client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&client_secret=${client_secret}&refresh_token=${refreshToken}&grant_type=refresh_token`
                })
                .then(res => res.text())
                .then(res => {
                    res = JSON.parse(res)
                    resolve(res)
                })
                .catch(err => reject(err))
               
            })
        }

        this.getDriveInfo = (params, rounded=true) => {
            const {token} = params
            const accessToken = token.access_token

            return new Promise((resolve, reject) => {
                fetch("https://graph.microsoft.com/v1.0/users/me/drives", {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type':	'application/json',
                    },
                })
                .then(res => res.text())
                .then(async (res) => {  
                    res = JSON.parse(res)
                    const quota = res.value[0].quota
                    const allocated = this.convertBytesToGigabytes(quota.used)
                    const total = this.convertBytesToGigabytes(quota.total)
                    let quotaStr;
                    if(rounded === false){
                        quotaStr = `${allocated} / ${total}`
                    }else{
                        quotaStr = `${allocated.toFixed(2)} / ${total}`
                    }
                    
                    const email = await this.getDriveEmail(accessToken)
                    resolve(
                        {
                            isActive: true,
                            email: email,
                            driveName: 'onedrive',
                            quota: quotaStr
                        }
                    )
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                });
            })
        }

        this.downloadFile = (params) => {
            const {name, token, fileId} = params
            const accessToken = token.access_token

            return new Promise((resolve, reject) => {
                fetch('https://graph.microsoft.com/v1.0/users/me/drive/items/'+fileId+'/content', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                    },
                })
                .then((res) => {  
                    const dest = fs.createWriteStream('./downloads/' + name);
                    res.body.pipe(dest);
                   
                    resolve()
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                });
            })
        }

        this.uploadFile = (params) => {
            const {name, token, aiofolder_id, driveEmail} = params
            const accessToken = token.access_token

            return new Promise((resolve, reject) => {

                fs.readFile('./downloads/' + name, function read(err, data) {
                    if (err) {
                        console.log(err)
                        reject()
                    }else{

                        fetch('https://graph.microsoft.com/v1.0/users/me/drive/items/'+aiofolder_id+':/'+name+':/content?@microsoft.graph.conflictBehavior=rename', {
                            method: 'PUT',
                            headers: {
                                'Authorization': 'Bearer '+accessToken,
                            },
                            body: data
                        })
                        .then(async (res) => {  
                            if(res.status === 200 || res.status === 201){
                                res = await res.text()
                                let fileMetadata = JSON.parse(res)
                                const normalMetadata = {
                                    id: fileMetadata.id,
                                    name: fileMetadata.name,
                                    email: driveEmail,
                                    drive: 'onedrive',
                                    path: ''
                                }
                                resolve(normalMetadata)
                            }else{
                                reject()
                            }
                        })
                        .catch(err => {
                            console.log(err)
                            reject(err)
                        });
                    }
                    
                });
            })
        }

        
        this.createNormalMetadata = (metadata) => {
            const normalMetadata = {
                name: metadata.name,
                email: metadata.email,
                drive: 'onedrive',
                path: ''
            }
            return normalMetadata
        }

        this.getFiles = (params/* accessToken, driveEmail, folderId */) => {
            const {token, driveEmail, folderId} = params
            const accessToken = token.access_token
            let url = ''
            // console.log(token)
            if(folderId){
                url = 'https://graph.microsoft.com/v1.0/users/me/drive/items/'+folderId+'/children'
            }else{//root
                url = 'https://graph.microsoft.com/v1.0/users/me/drive/root/children'
            }
            return new Promise((resolve, reject) => {
                fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type':	'application/json',
                    },
                })
                .then(res => res.text())
                .then(async (res) => {  
                    let files = []
                    res = JSON.parse(res)
 
                    const fileObjs = res.value
                    
                    for(var i=0; i<fileObjs.length; i++){
                        const file = fileObjs[i]

                        files.push({    
                            id: file.id,
                            name: file.name,
                            createdTime: file.createdDateTime.substring(0, 10),
                            permissionIds: file.shared ? ['shared'] : [''],
                            type: file.folder ? 'folder' : 'file', 
                            email: driveEmail,
                            drive: 'onedrive',
                            extension: (
                                file.folder ? 'folder' : this.getFileExtension(file.name)
                            ),
                            path: '',
                            downloadUrl: file['@microsoft.graph.downloadUrl'],
                            size: file.size
                        })
                    }
                   
                    resolve(files)
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                });
            })
        }

        this.renameFile = (params) => {
            const {newName, fileId, token} = params
            const accessToken = token.access_token

            return new Promise((resolve, reject) => {
                fetch("https://graph.microsoft.com/v1.0/users/me/drive/items/"+fileId, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type':	'application/json',
                    },
                    body: JSON.stringify({
                        "name": newName
                    })
                })
                .then(res => {  
                    if(res.status === 200){
                        resolve('OK')
                    }
                    resolve()
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                });
            })
            
        }

        this.deleteFile = (params) => {
            const {token, fileId} = params
            const accessToken = token.access_token

            return new Promise((resolve, reject)=>{
                fetch("https://graph.microsoft.com/v1.0/users/me/drive/items/"+fileId, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                    },
                })
                .then(res => { 
       
                    if(res.status === 401){
                        resolve('expired token')
                    }else if(res.status === 204){
                        resolve('OK')
                    }

                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                });
            })    
        }

        this.getShareUrl = (params) => {
            const {token, fileId} = params
            let accessToken = token.access_token

            return new Promise((resolve, reject) => {

                fetch("https://graph.microsoft.com/v1.0/users/me/drive/items/"+fileId+"/createLink", {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "view",
                        "scope": "anonymous"
                    })
                })
                .then(res => res.text())
                .then(res => {
                    
                    res = JSON.parse(res)
                     
                    if(res.link.webUrl){
                        resolve('onedrive:'+res.link.webUrl)
                    }else{
                        reject('error creating share url')
                    }
                               
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })

            })
        }

        this.disableSharing = (params) => {
            const {fileId, token} = params
            const accessToken = token.access_token
            return new Promise((resolve, reject) => {
                fetch("https://graph.microsoft.com/v1.0/users/me/drive/items/"+fileId+"/createLink", {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "type": "view",
                        "scope": "anonymous"
                    })
                })
                .then(res => res.text())
                .then(res => {
                   
                    res = JSON.parse(res)
                    fetch("https://graph.microsoft.com/v1.0/users/me/drive/items/"+fileId+"/permissions/"+res.id, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': 'Bearer '+accessToken,
                        },
                    })
                    .then(res => {
                      
                        if(res.status === 204){
                            resolve('OK')
                        }
    
                    })
                    .catch(err => {
                        console.log(err)
                        reject(err)
                    })

                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })

            })
        }

        this.createFolder = (params) => {
            const {parentId, token, driveEmail, folderName} = params
            const accessToken = token.access_token
            const name = (folderName === undefined ? 'New Folder' : folderName)

            let url = ''
            if(parentId != ''){
                url = "https://graph.microsoft.com/v1.0/users/me/drive/items/"+parentId+"/children"
            }else{
                url = "https://graph.microsoft.com/v1.0/users/me/drive/root/children"
            }
            return new Promise((resolve, reject) => {
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "name": name,
                        "folder": { },
                        "@microsoft.graph.conflictBehavior": "rename"
                    })
                })
                .then(res => res.text())
                .then(res => {
                    res = JSON.parse(res)
                    
                    const file = {
                        id: res.id,
                        name: res.name,
                        createdTime: res.createdDateTime.substring(0, 10),
                        permissionIds: res.shared ? ['shared'] : [''],
                        type: res.folder ? 'folder' : 'file', 
                        email: driveEmail,
                        drive: 'onedrive',
                        extension: 'folder',
                        path: '',
                    }
                    resolve(file)
                })
                .catch(err => reject(err))
            })  
        }
   
        this.getFileExtension = (nameWithExtension, fileType) => {

            if(fileType === 'folder'){
                return 'folder'
            }
            const [name, fileExtension] = nameWithExtension.split(SPLIT_LAST_DOT_REGEXP)
            return fileExtension
        }

        this.convertBytesToGigabytes = (bytes) => {
            bytes = parseFloat(bytes)
            return (bytes / Math.pow(2, 30))/* .toFixed(2) */
        }
    }
}
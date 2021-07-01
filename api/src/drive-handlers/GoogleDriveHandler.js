import { google } from 'googleapis'
import { pushRefreshedAccessTokenToDatabase } from '../utilities/MongoFunctions.js'
import fs from 'fs'

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const ROOT_FILES_QUERY= "'root' in parents and not trashed"
const SPLIT_LAST_DOT_REGEXP = /\.(?=[^\.]+$)/

export default class GoogleDriveHandler {
  
    constructor() {
        this.drive = null
        this.oAuth2Client = null
        this.email = null

        this.initialize = async () => {
            const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS)
            const {client_secret, client_id, redirect_uris} = credentials.installed;
            this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            this.drive = google.drive({version: 'v3', auth: this.oAuth2Client});
            
        }

        this.authorize = (/* res */) => {
            /* this.res = res  */    
            let authUrl = ''
 
            return new Promise(async (resolve, reject) => {
                authUrl = await this.getAccessToken().catch(err=>{
                    reject(err)
                    return
                });
                resolve(authUrl)
            })

        }

        this.checkIfTokenExpired = (token, userEmail, driveEmail) => {
            return new Promise(async (resolve, reject) => {
                const expiryDate = new Date(token.expiry_date)
                const currentDate = new Date()
                if(currentDate > expiryDate ){
                    console.log('gdrive token expired')
                    const newToken = await this.refreshToken(token.refresh_token).catch(err => {
                        console.log(err)
                        reject(err)
                        return
                    })
                    if(newToken){
                        const response = await pushRefreshedAccessTokenToDatabase(newToken, userEmail, driveEmail, 'google-drive').catch(err => {
                            console.log(err)
                            reject(err)
                            return
                        })

                        if(response === 'OK'){
                            resolve(newToken)
                        }else{
                            resolve('err pushing refreshed access token to database')
                        }
                    }
                }else{
                    console.log('gdrive token not expired')
                    resolve(token)
                }
                
            })
            
        }

        this.refreshToken = async (refreshToken) => {
            return new Promise(async (resolve, reject) => {
                const res = await this.oAuth2Client.refreshToken(refreshToken).catch((err)=>{reject(err)})
                let newToken = res.tokens 
                newToken.refresh_token = refreshToken
                resolve(newToken)

            })
          
        }

        this.getAccessToken = () => {

            return new Promise((resolve, reject) => {
                const authUrl = this.oAuth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES,
                });
                resolve(authUrl)
                return
            })
        }

        this.generateToken = (code) => {
            return new Promise((resolve, reject) => {
                this.oAuth2Client.getToken(code,  async (err, token) => {
                    if (err){
                        reject('Error retrieving access token')
                        return
                       /*  return console.log('Error retrieving access token', err); */
                    } 
                    // this.oAuth2Client.setCredentials(token);
                    resolve(token)
                });
            })
        }

        this.setToken = async (token) => {
            return new Promise(async (resolve, reject) => {
                this.oAuth2Client.setCredentials(token)
                this.email =  await this.getDriveEmail().catch(err=>{
                    console.log(err)
                    reject(err)
                    return
                })
                resolve()
            }) 
           
        }

        this.getDriveEmail = async () => {
            const response = await this.drive.about.get({fields: 'user'}).catch(err => {
                return null
            })
            if(response){
                return(response.data.user.emailAddress)
            }else{
                return null
            }
            
        }

        this.getDriveInfo = async(rounded=true) => {
           
            const quota = await this.getStorageQuota()
            let quotaStr;
            if(rounded === false){
                quotaStr = `${quota.allocated} / ${quota.total}`
            }else{
                quotaStr = `${quota.allocated.toFixed(2)} / ${quota.total}`
            }

            return {
                isActive: true,
                email: this.email,
                driveName: 'google-drive',
                quota: quotaStr
            }
        }
    
        this.getFiles = (params/* type, folderId */) => {
            const {type, folderId} = params
            const query = this.createQuery(type, folderId)

            return new Promise((resolve, reject) => {
                this.drive.files.list({
                    q: query,
                    pageSize: 1000,
                    fields: 'nextPageToken, files(id, size, name, mimeType, createdTime, webContentLink, exportLinks, parents, permissionIds)',
                },async (err, res) => {
                    try{
                        if (err){
                            reject('The API returned an error: ' + err)
                           
                        } 
                        const files = res.data.files;
                        if (files.length) {
                            files.forEach((file)=>{
                                if (file.mimeType === 'application/vnd.google-apps.folder'){
                                    file.type = 'folder'
                                }else{
                                    file.type = 'file'
                                }
                                file.email = this.email
                                file.drive = 'google-drive'
                                file.extension = this.getFileExtension(file.name, file.mimeType)
                                file.createdTime = file.createdTime.substring(0, 10),
                                file.path = ''
                            })
                            resolve(files)
                        } else {
                            resolve([])  
                        }
                    }catch(err){
                        reject(err)
                    }
                })
            })
        }

        this.createQuery = (type, folderId) => {

            switch(type) {
                case 'root_files':
                    return ROOT_FILES_QUERY
                
                case 'folder_contents':
                    const folderContentsQuery = `'${folderId}' in parents`
                    return folderContentsQuery
            }

        }
            
        this.deleteFile = (params) => {
            const {fileId} = params
            return new Promise((resolve, reject)=>{
            
                this.drive.files.delete({
                    fileId: fileId
                },(err, res) => {
                    if(err){
                        console.log('Error deleting the file! error: ', err)
                        reject('Error deleting the file! error: '+err)
                    }else{
                        resolve('OK')
                    }
                })
            })
            
        }

        this.downloadFile = (params) => {
            
            return new Promise((resolve, reject) => {
                const {fileId, name} = params
                var dest = fs.createWriteStream('./downloads/' + name);
                
                this.drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
                    (err, res) => {
                        res.data
                        .on('end', () => {
                            resolve()
                        })
                        .on('error', err => {
                            reject(err)
                        })
                        .pipe(dest);
                    }
                );
            })
        }

        this.getShareUrl = (params) => {
            const {fileId} = params
            return new Promise((resolve, reject) => {
                const permission = {
                    role: 'reader',
                    type: 'anyone'
                }
                this.drive.permissions.create({
                    resource: permission,
                    fileId: fileId,
                    fields: 'id'
                }).then(res => {
                    
                    if (res.status === 200) {
                        resolve('google-drive:https://drive.google.com/open?id='+fileId)
                    }else{
                        reject('Failed to create share url') // ???
                    }
                    
                }).catch(err => {
                    reject(err)
                })
            })
        }

        this.disableSharing = (params) => {
            const {fileId} = params
            return new Promise((resolve, reject) => {
                this.drive.permissions.delete({
                    fileId: fileId,
                    permissionId: 'anyoneWithLink'
                }).then((res) => {
                   
                    if(res.status === 204){
                        resolve('OK')
                    }else{
                        reject('Unknown error occured.')
                    }
                }).catch(err => {
        
                    reject('The permission "anyoneWithLink" wasnt found')
                })
            })
        }

        this.renameFile = (params) => {
            const {fileId, newName} = params
            return new Promise((resolve, reject)=>{
                const fileMetadata = {
                    name: newName
                }

                this.drive.files.update({
                    resource: fileMetadata,
                    fileId: fileId,
                }, (err, res) => {
                    if (err) {
                        // Handle error
                        console.error('File rename failed! error: ', err);
                        reject('File rename failed! error: ', err)
                    } else {
                        resolve('OK')
                        
                    }
                });
            })
        }

        this.createFolder = (params) => {
            const {parentId, folderName} = params
            const name = (folderName === undefined ? 'New Folder' : folderName)
            return new Promise((resolve, reject) => {
                let metadata = {
                    name: name,
                    mimeType: 'application/vnd.google-apps.folder',
                }
                if(parentId !== ''){
                    metadata.parents = [parentId]
                }
    
                this.drive.files.create({
                    resource: metadata,
                }).then(res=>{
                    resolve(res.data)
                }).catch(err => {
                    reject(err)
                })
            })
            
        }

        /* for larger files need to search the resumable upload method */
        this.uploadFile = (params) => {
            return new Promise((resolve, reject) => {
                const {name, aiofolder_id, driveEmail} = params
                /* const mimeType = this.getMimeType(name) */
                
                const fileMetadata = {
                    name: name,
                    parents: [aiofolder_id]
                }
                const media = {
                    mimeType: 'text/plain',
                    body: fs.createReadStream('./downloads/' + name)
                }

                this.drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id, name'
                }, (err, res) => {
                    if(err) {
                        reject(err)
                    }else{
                        res = res.data
                        const normalMetadata = {
                            id: res.id,
                            name: res.name,
                            email: driveEmail,
                            drive: 'google-drive',
                            path: ''
                        }
                        resolve(normalMetadata)
                    }
                });
            })
        }


        /* this.getMimeType = (nameWithExtension) => {

            let fileExtension = this.getFileExtension(nameWithExtension)
            fileExtension = 'txt'
            const mimeType = mime.getType(fileExtension)
            return mimeType
        } */


        this.getFileExtension = (nameWithExtension, mimeType) => {
            const [name, fileExtension] = nameWithExtension.split(SPLIT_LAST_DOT_REGEXP)
            if(mimeType === 'application/vnd.google-apps.spreadsheet'){
                return 'gxl'
            }else if(mimeType === 'application/vnd.google-apps.document'){
                'application/vnd.google-apps.document'
                return 'gdoc'
            }else if(mimeType === 'application/vnd.google-apps.folder'){
                return 'folder'
            }else if(mimeType === 'application/vnd.google-apps.presentation'){
                return 'gpres'
            }else {
                return '.'+ fileExtension
            }
        }

        this.getStorageQuota = async() => {

            const response = await this.drive.about.get({fields: 'storageQuota'}).catch(err => console.log(err))
            const storageQuota  = response.data.storageQuota
            let totalSpace = this.convertBytesToGigabytes(storageQuota.limit)
            if(isNaN(totalSpace)){totalSpace='∞'}//some accounts have infinite quota
            const allocatedSpace = this.convertBytesToGigabytes(storageQuota.usage)
            const freeSpace = totalSpace - allocatedSpace       
            const storageQuotaObject = {total: totalSpace, allocated: allocatedSpace, free: freeSpace}

            return storageQuotaObject
        }

        this.convertBytesToGigabytes = (bytes) => {
            bytes = parseFloat(bytes)
            return (bytes / Math.pow(2, 30))/* .toFixed(2) */
        }
    }     
}
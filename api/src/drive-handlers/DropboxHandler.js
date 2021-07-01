import * as  dropboxV2Api from 'dropbox-v2-api'
import fs from 'fs'

const SPLIT_LAST_DOT_REGEXP = /\.(?=[^\.]+$)/

export default class DropboxHandler {
  
    constructor() {
        this.dropbox = null

        this.initialize = async () => {
            const credentials = JSON.parse(process.env.DROPBOX_CREDENTIALS)
            this.dropbox = dropboxV2Api.authenticate({
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                redirect_uri: credentials.redirect_uri
            });
            
        }

        this.authorize = () => {
            let authUrl = ''
            return new Promise(async (resolve, reject) => {
                authUrl = await this.dropbox.generateAuthUrl()
                resolve(authUrl)
            })

        }

        this.generateToken = (code) => {
            return new Promise((resolve, reject) => {
                this.dropbox.getToken(code, (err, result, response) => {
                    if(err){
                        reject(err)
                        return
                    }

                    resolve({"access_token": result.access_token})
                })
            })
        }

        this.setToken = (token) => {
            return new Promise((resolve, reject) => {
                token = token.access_token
                this.dropbox = dropboxV2Api.authenticate({
                    token: token
                })

                resolve()
            })
        }
        
        this.getDriveEmail = () => {
            return new Promise((resolve, reject)=> {
                this.dropbox({
                    resource: 'users/get_current_account',
                }, (err, result, response) => {
                    if (err) { console.log(err); reject(err); return }
                    resolve(result.email)
                });
            })
            
        }

        this.getFiles = async (params/*email, folderName='', path=''*/) => {
            const {driveEmail, folderName, path} = params
            return new Promise((resolve, reject) => {
                var files = []
               
                this.dropbox({
                    resource: 'files/list_folder',
                    parameters: {
                        'path': path+folderName,
                        'recursive': false,
                        'include_media_info': false,
                        'include_deleted': false,
                        'include_has_explicit_shared_members': false,
                        'include_mounted_folders': true,
                        'include_non_downloadable_files': true
                    }
                }, async (err, result, response) => {
                    if(err){
                        reject(err)
                        return
                    }

                    const sharedLinks = await this.getSharedLinks()
                    for (var i=0; i<result.entries.length; i++){
                        const file = result.entries[i]
                        const splits = file.path_lower.split('/')
                        const name = splits[splits.length-1]
                      
                        const n = file.path_lower.lastIndexOf(name);
                        const pathWithoutName = file.path_lower.substring(0, n)
                      
              
                        let sharedLink = ['']
                    
                        for (var j=0; j<sharedLinks.length; j++){
                            if(sharedLinks[j].id === file.id){
                                sharedLink = ['dropbox:'+sharedLinks[j].url]
                                break
                            }
                        }
                         
                        files.push({
                            id: file.id,
                            name: file.name,
                            createdTime: (
                                file['.tag'] === 'folder' ? '-' : file.client_modified.substring(0, 10)
                            ),
                            permissionIds: sharedLink,
                            type: file['.tag'],
                            email: driveEmail,
                            drive: 'dropbox',
                            extension: (
                                file['.tag'] === 'folder' ? 'folder' : this.getFileExtension(file.name)
                            ),
                            path: pathWithoutName,
                            size: file.size
                        })           
                    }
                   
                    resolve(files)
                });
            })
        }

        this.createFolder = (params) => {
            let {path, driveEmail, folderName} = params
            const name = (folderName === undefined ? 'New Folder' : folderName)

            if(path === '/'){
                path = '' //this fixes the bug when uploading a folder in root. cause root path is '/' + '/New folder' leads to '//New Folder
            }
            return new Promise((resolve, reject) => {
                this.dropbox({
                    resource: 'files/create_folder',
                    parameters: {
                        'path': path+'/'+name,
                        'autorename': true
                    }
                }, (err, result, response) => {
                   
                    if(err){
                        reject(err)
                    }else{
                        const oldMetadata = result.metadata
                        let newMedata = {
                            id: oldMetadata.id,
                            name: oldMetadata.name,
                            createdTime: 'No date',
                            permissionIds: [''],
                            type: 'folder',
                            email: driveEmail,
                            drive: 'dropbox',
                            extension: 'folder',
                            path: path+'/',
                        }
                        console.log(newMedata)
                        resolve(newMedata)
                    }
    
                });
            })
        
        }

        this.getSharedLinks = (fileId) => {
            return new Promise((resolve, reject) => {
                this.dropbox({
                    resource: 'sharing/list_shared_links',
                    parameters: {}
                }, (err, result, response) => {
                    
                    if(err){
                        console.log(err)
                        reject(err)
                    }else{
                        resolve(result.links)
                    }
                });
            }) 
        }

        
        this.getFileExtension = (nameWithExtension, fileType) => {

            if(fileType === 'folder'){
                return 'folder'
            }
            const [name, fileExtension] = nameWithExtension.split(SPLIT_LAST_DOT_REGEXP)
            return fileExtension
        }

        this.getDriveInfo = async(params, rounded=true) => {
            const {email} = params
            return new Promise(async (resolve, reject) => {
                const quota =  await this.getStorageQuota()
                let quotaStr;
                if(rounded === false){
                    quotaStr = `${quota.allocated} / ${quota.total}`
                }else{
                    quotaStr = `${quota.allocated.toFixed(2)} / ${quota.total}`
                }
                
                resolve({
                    isActive: true,
                    email: email,
                    driveName: 'dropbox',
                    quota: quotaStr
                })
            })
            
        }

        this.getStorageQuota = async() => {

            return new Promise((resolve, reject) => {
                this.dropbox({
                    resource: 'users/get_space_usage'
                }, (err, result, response) => {
                    if(err){
                        reject(err)
                    }else{
                        let totalSpace = this.convertBytesToGigabytes(result.allocation.allocated)
                        let usedSpace = this.convertBytesToGigabytes(result.used)

                        resolve({total: totalSpace, allocated: usedSpace})
                    }
                });
            })
        }

        this.convertBytesToGigabytes = (bytes) => {
            bytes = parseFloat(bytes)
            return (bytes / Math.pow(2, 30))/* .toFixed(2) */
        }

        this.renameFile = (params) => {
            const {newName, oldName, path} = params
            const oldPath = path+oldName
            const newPath = path+newName

            return new Promise((resolve, reject) => {
                this.dropbox({
                    resource: 'files/move',
                    parameters: {
                        'from_path': oldPath,
                        'to_path': newPath,
                        'allow_shared_folder': false,
                        'autorename': false,
                        'allow_ownership_transfer': false
                    }
                }, (err, result, response) => {
                    console.log(err)
                    if(err){
                        reject(err)
                    }else{
                        resolve('OK')
                    }
                });
            })
            
        }

        this.deleteFile = (params) => {
            const {fileName, path} = params
            
            return new Promise((resolve, reject)=>{
                this.dropbox({
                    resource: 'files/delete',
                    parameters: {
                        'path': path+fileName
                    }
                }, (err, result, response) => {
                    if(err){
                        reject(err)
                    }else{
                        resolve('OK')
                    }
                    //see docs for `result` parameters
                });
            })      
        }

        this.getExistingSharedLink = (fileId) => {
            return new Promise((resolve, reject) => {
            
                this.dropbox({
                    resource: 'sharing/list_shared_links',
                    parameters: {
                        "path": fileId
                    }
                }, (err, result, response) => {
                    if(err){
                        reject(err)
                    }else{
                        if(result.links[0] !== undefined){
                            resolve('dropbox:'+result.links[0].url)
                        }else{
                            resolve('not exists')
                        }
                        
                    }

                });
            })
        }

        this.getShareUrl = (params) => {
            const {path, fileName} = params

            return new Promise((resolve, reject) => {
            
                this.dropbox({
                    resource: 'sharing/create_shared_link_with_settings',
                    parameters: {
                        'path': path+fileName,
                        'settings': {
                            'requested_visibility': 'public',
                            'audience': 'public',
                            'access': 'viewer'
                        }
                    }
                }, (err, result, response) => {
                    if(err){
                        reject(err)
                    }else{
                        resolve('dropbox:'+result.url)
                    }

                });
            })
        }

        this.disableSharing = (params) => {
            let {sharedLink} = params
            sharedLink = sharedLink.replace('dropbox:', '')
            return new Promise((resolve, reject) => {
                this.dropbox({
                    resource: 'sharing/revoke_shared_link',
                    parameters: {
                        'url': sharedLink
                    }
                }, (err, result, response) => { //null result result means 'OK'

                    if(err){
                        reject(err)
                    }else{
                        resolve('OK')
                    }
                    
                });
            })
        }

        this.uploadFile = (params) => {
            const {path, name, driveEmail} = params

            return new Promise((resolve, reject) => {
                const stream = this.dropbox({
                    resource: 'files/upload',
                    parameters: {
                        path: path+name,
                        mode: 'add',
                        autorename: true,
                        mute: false,
                        strict_conflict: false
                    }
                }, (err, result, response) => {
                    if(err){
                        console.log(err)
                        reject('Error uploading file in dropbox')
                    }else{
                        const fileMetadata = response.body
                        const normalMetadata = {
                            id: fileMetadata.id,
                            name: fileMetadata.name,
                            email: driveEmail,
                            drive: 'dropbox',
                            path: '/aio drive/'
                        }
                        resolve(normalMetadata)
                    }
                })
                fs.createReadStream('./downloads/' + name).pipe(stream)
            })
        }

        this.downloadFile = (params) => {
            const {path, name} = params
            return new Promise((resolve, reject) => {
                this.dropbox({
                    resource: 'files/download',
                    parameters: {
                        path: path+name
                    }
                }, (err, result, response) => {
                    if(err){
                        reject('Error uploading file in dropbox')
                    }else{
                        resolve('OK')
                    }
                    //download completed
                })
                .pipe(fs.createWriteStream('./downloads/' + name));
            })
        }
    }     
}
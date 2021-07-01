import mongoose from 'mongoose'
import { 
    pushVirtualFolderToDatabase, 
    getVirtualFolderFiles, 
    deleteFolderObjectFromDatabase,
    renameFileObjectInDatabase,
    saveSharedVirtualFolderInfoInDatabase,
    removeSharedVirtualFolderInfoFromDatabase,
    getSharedFoldersFromDatabase,
    getSharedFolderContentsFromDatabase,
    setLoggedUserEmail,
    getUserSharedFolderIdFromDatabase,
} from '../utilities/MongoFunctions.js'

import User from '../utilities/User.js'


export default class AioDriveHandler {
    constructor(){

        this.createFolder = (userEmail, parentId) => {
            return new Promise( async (resolve, reject) => {
                const date = new Date()
                const dateString = date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()
                const folderObj = {
                    id: mongoose.Types.ObjectId(),
                    name:'New Virtual Folder',
                    parents:[''],
                    createdTime: dateString,
                    permissionIds:[''],
                    type: 'folder',
                    email: userEmail,
                    drive:'aio-drive',
                    extension: 'folder',
                    path: '',
                    virtualParent: parentId,
                }
                const res = await pushVirtualFolderToDatabase(folderObj, userEmail).catch(err=>{console.log(err)})
                if(res === 'OK'){
                    resolve({response: 'OK', folderObj})
                }else{
                    reject('Error creating virtual folder')
                }
            })   
        }

        this.getFiles = async (folderId, userEmail, folderEmail, folderName) => {
            await setLoggedUserEmail(userEmail)
            return new Promise(async (resolve, reject) => {
                let files = [];
                if(folderName === 'Shared with me'){
                    files = await getSharedFoldersFromDatabase(userEmail).catch(err => {
                        reject(err)
                        return
                    })
                }else if(folderEmail !== userEmail && folderEmail !== undefined){ //root has undefined folderemail. So we have to skip that check
                    files = await getSharedFolderContentsFromDatabase(folderId, folderEmail, userEmail).catch(err => {
                        reject(err)
                        return
                    })
                }else{
                    files = await getVirtualFolderFiles(folderId, userEmail).catch(err=>{
                        reject(err)
                        return
                    })
                }
                /* hideOtherSharedUsersFiles(files) */
                resolve(files)
            })
        }

        this.deleteFile = (fileId, userEmail) => {
            return new Promise(async (resolve, reject) => {
                const res = await deleteFolderObjectFromDatabase(fileId, userEmail).catch(err=>{
                    console.log(err)
                    reject(err)
                    return
                })
                if(res !== undefined){
                    resolve(res)
    
                }else{
                    reject('Something went wrong with deleting the file from the database')
                }
            })
            
        }

        this.renameFile = (fileId, newName, userEmail) => {
            return new Promise(async (resolve, reject) => {
                const res = await renameFileObjectInDatabase(fileId, newName, userEmail).catch(err=>{
                    console.log(err)
                    reject(err)
                    return
                })
                if(res === 'OK'){
                    resolve('OK')
    
                }else{
                    reject('Something went wrong with renaming the file in the database')
                }
            })
            
        }

        this.shareVirtualFolder = (fileId, userEmail, sharedWithEmail) => {

            return new Promise(async (resolve, reject) => {
                const res = await saveSharedVirtualFolderInfoInDatabase(fileId, userEmail, sharedWithEmail)
                if(res === 'OK'){
                    resolve('OK')
                }else{
                    resolve(res)
                }
            })
        }

        this.unshareVirtualFolder = (fileId, userEmail, sharedWithEmail) => {
            return new Promise(async (resolve, reject) => {
                const res = await removeSharedVirtualFolderInfoFromDatabase(fileId, userEmail, sharedWithEmail)
                if(res === 'OK'){
                    resolve('OK')
                }else{
                    reject()
                }
            })
        }

        this.findSharedFileMetadata = (fileId, fileEmail) => {
            
            return new Promise(async (resolve, reject) => {
                User.findOne({email: fileEmail}, async function(err, user){
                   /*  console.log(user) */
                    if(err || !user ){
                        reject('error: couldnt fine shared file email and drivetype')
                    }else{

                        const files = user.virtualdrive.files
                        for(let i=0; i<files.length; i++){
                            if(files[i].id === fileId){
                                resolve(['OK', files[i]])
                                break
                            }
                        }
  
                    }
                })
              
            })
        }

        this.getUserSharedFolderId = (userEmail) => {
            return new Promise(async(resolve, reject) => {
                const userSharedFolderId = await getUserSharedFolderIdFromDatabase(userEmail)
                if(userSharedFolderId){
                    resolve(userSharedFolderId)
                }else{
                    reject()
                }
            })
        }

    }
}
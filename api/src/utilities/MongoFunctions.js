
import User from '../utilities/User.js'
import createJsonResponse from '../utilities/ResponseMaker.js'
import mongoose from 'mongoose'
import {encrypt, decrypt} from './AES256Handler.js'
import { file } from 'googleapis/build/src/apis/file';

let loggedUserEmail;
let loggedUserDrives = [];

export const setLoggedUserEmail = (userEmail) => {
    return new Promise( async(resolve, reject) => {
        loggedUserDrives = []
        const driveTypes = ['google-drive', 'onedrive', 'dropbox']
        loggedUserEmail = userEmail
        const user = await User.findOne({email: userEmail})
        for(let i=0; i<driveTypes.length; i++){
            for(let j=0; j<user[driveTypes[i]].length; j++){
                loggedUserDrives.push({email: user[driveTypes[i]][j].email, drive: driveTypes[i]})
            }
        }
        resolve()
    })
   
}

export const hideOtherSharedUsersFiles = (files, userEmail) => {
    for(let i=0; i<files.length; i++){
        if(files[i].type === 'file'){

            let check = false;
            for (let j=0; j<loggedUserDrives.length; j++){
                
                if(files[i].email === loggedUserDrives[j].email && files[i].drive === loggedUserDrives[j].drive){
                    check = true
                }
            }
            if(check === false){
                files[i].drive ='aio-drive'
                files[i].email = userEmail
            }
        }
    }
    return files
}

export const getDriveModeFromDatabase = (userEmail) => {
    return new Promise((resolve, reject) => {
   
        User.findOne({ email: userEmail}, function(err, user) {
            if(err){
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success
                resolve(user.virtualdrive.enabled)   
            }
        })   
    })    
}

export const saveDriveModeInDatabase = (userEmail, virtualDriveEnabled) => {
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            {email: userEmail}, 
            {$set: {'virtualdrive.enabled': virtualDriveEnabled}},
            {upsert: true}, function(err) {   
                if(err){

                    reject('error saving the drive mode')
                }else{
                    resolve('OK')
                }
        
            }
        )
    })
}

export const getTokenFromDatabase = (userEmail, driveEmail, driveType) => {

    return new Promise((resolve, reject) => {
        
        User.findOne({ email: userEmail}, function(err, user) {
            if(err){
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success
                for(var i=0; i<user[driveType].length; i++){
                    if(user[driveType][i].email === driveEmail){
                        const token = decrypt(user[driveType][i].token)
                        resolve(JSON.parse(token))
                    }
                }
                
            }
        })   
    })    
}

export const removeSharedVirtualFolderInfoFromDatabase = (fileId, userEmail, sharedWithEmail) => {

    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            {email: userEmail, 'virtualdrive.folders.id': mongoose.mongo.ObjectId(fileId)},
            {$pull: {
                'virtualdrive.folders.$.permissionIds': sharedWithEmail,
                'virtualdrive.sharedFolders': {sharedWithEmail: sharedWithEmail, virtualFolderId: fileId}
            }} ,
            async function(err, user) { 
                if(err){
                    console.log(err)
                    reject(err)
                }else if(!user){
                    console.log('Wrong query')
                    reject('Wrong query')
                }else{
                    //await removeSharedWithMeEmail(userEmail, sharedWithEmail, fileId).catch(err => {/* console.log(err) */})
                    resolve('OK')
                }

            }
        )
       
    })
}

const removeSharedWithMeEmail = (userEmail, sharedWithEmail, fileId) => {

    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            {email: sharedWithEmail}, 
            {$pull: {
                'virtualdrive.sharedWithMeEmails': {email: userEmail, folderId: fileId},
            }},
            {upsert: true}, function(err) {   
                if(err){
                    console.log(err)
                    reject('error deleting sharedWithEmail')
                }else{
                    resolve('OK')
                }
        
            }
        )
    })
    
}

export const saveSharedVirtualFolderInfoInDatabase = (fileId, userEmail, sharedWithEmail) => {
  
    return new Promise((resolve, reject) => {
        if(userEmail === sharedWithEmail){
            resolve('Cant share share folder with yourself')
            return
        }
        User.findOne({email: userEmail},function(err, user) {  

            //if already shared with this user, do actually nothing
            for(let i=0; i<user.virtualdrive.sharedFolders.length; i++){
                if(user.virtualdrive.sharedFolders[i].virtualFolderId === fileId &&
                    user.virtualdrive.sharedFolders[i].sharedWithEmail === sharedWithEmail){

                    resolve('OK')
                    return
                }
            }
            //else find and update
            User.findOneAndUpdate(
                {email: userEmail, 'virtualdrive.folders.id': mongoose.mongo.ObjectId(fileId)}, 
                {$push: {
                    'virtualdrive.sharedFolders': {virtualFolderId: fileId, sharedWithEmail},
                    'virtualdrive.folders.$.permissionIds': sharedWithEmail

                }},
                {upsert: true}, function(err) {   
                    if(err){
                        console.log(err)
                        reject('error saving the shared folder info in the database')
                    }else{
                        resolve('OK')
                    }
            
                }
            )

           /*  User.findOneAndUpdate(
                {email: sharedWithEmail, 'virtualdrive.sharedWithMeEmails.email': userEmail}, 
                {$addToSet: {
                    'virtualdrive.sharedWithMeEmails': {email: userEmail},
       
                }},
                {upsert: true}, function(err) {   
                    if(err){
                        console.log(err)
                        reject('error saving the shared folder info in the database')
                    }else{
                        resolve('OK')
                    }
            
                }
            ) */

        })
       
    })
}

export const getSharedFolderContentsFromDatabase = (folderId, folderEmail, userEmail) => {

    return new Promise((resolve, reject) => {
        User.findOne(
            {
                email: folderEmail, 
                'virtualdrive.sharedFolders.sharedWithEmail': userEmail, 
                'virtualdrive.sharedFolders.virtualFolderId': folderId
            }, 
            async function(err, user) {
                if(err){
                    reject(err)
                }else if(!user){//for security reasons, we must double check if nested folder has a shared parent
                    User.findOne({email: folderEmail}, async function(err, user){
                        if(err){
                        
                            reject(err)
                        }else if(!user){
                            reject('this query was wrong')
                        }else{
             
                            const flag = checkIfParentIsShared(folderId, user, 'folders')
        
                            if(flag === true){
                                const files = await getVirtualFolderFiles(folderId, folderEmail)
                                
                                resolve(files)
                           }else{ 
                                
                                const files = await getVirtualFolderFiles(folderId, folderEmail)
                                resolve(files)
                           }
                        }
                    })
                   
                }else{//success
                    const files = await getVirtualFolderFiles(folderId, folderEmail)
                    
                    resolve(files)
                
                }
            }
        )
    })
}


const getOtherUsersSharedFilesWithinYourSharedFolder = async (folderOwner, currentFolderId) => {
    //logiki pou mallon xreiazetai. vriskw to parent autou tou folder ews otou virtualParent = root .
    //tha einai shared. meta vriskw ton user tu parent
    //diatrexw ta shared emails
    //kai psaxnw se ola auta ta emails an uparxei item me auto to parent

    if(currentFolderId !== 'root'){
        const folders = folderOwner.virtualdrive.folders
        for (let i=0; i<folders.length; i++){ //for every folder of owner
            if(folders[i].id.toString() === currentFolderId){ //find the current folder
                let topParentInfo, otherSharedEmails;

                if(folders[i].virtualParent !== 'root'){ //find the top parent and get the permissions from there
                    topParentInfo = await getTopParentFolderInfo(folders[i].virtualParent)
                    otherSharedEmails = topParentInfo.permissionIds
                    otherSharedEmails.push(topParentInfo.email)
                }else{ //else if parent already in root, we can find the sharedemails this folder has
                    otherSharedEmails = folders[i].permissionIds
                    otherSharedEmails.push(folders[i].email)
                }
                
                /* console.log(otherSharedEmails) */
                let otherSharedFiles = []
                for(let j=0; j<otherSharedEmails.length; j++){
                    if(otherSharedEmails[j] !== '' && otherSharedEmails[j] !== folderOwner.email){
                        const newFiles = await getVirtualFolderFiles(currentFolderId, otherSharedEmails[j], false)
                        otherSharedFiles = [...otherSharedFiles, ...newFiles]
                    }
                }
                return otherSharedFiles
            }
        }
    }
    return []
}



//this function is for double checking if nested
//folders inside a shared folder can also be accessible.
//for security reasons and protected api requests
export const checkIfParentIsShared = (folderId, user, type) => {

    let folders;
    if(type === 'files'){
        folders = user.virtualdrive.files
    }else{
        folders = user.virtualdrive.folders
    }
    const sharedFolders = user.virtualdrive.sharedFolders

    for(let i=0; i<folders.length; i++){

        if(folders[i].id.toString() === folderId ){
            if(folders[i].virtualParent === 'root'){
                return false
            }else{
                for(let j=0; j<sharedFolders.length; j++){
                    if(folders[i].virtualParent === sharedFolders[j].virtualFolderId){
                        
                        return true
                    }
                }
                return checkIfParentIsShared(folders[i].virtualParent, user, 'folders')
            }
            /* for(let j=0; j<sharedFolders.length; j++){
                
            } */
        }
    }
}

export const getSharedFoldersFromDatabase = (userEmail) => {

    /* return new Promise((resolve, reject) => { 
        User.find({email: userEmail }, 
            function(err, user) { 
                if(err){
                    reject(err)
                }else if(!user){
                    reject(`User ${userEmail} was not found in the database`)
                }else{//success
                    
                    const sharedWithEmailObjs
                    
                    
                }

            }
        )
    }) */



    return new Promise((resolve, reject) => {
        User.find({'virtualdrive.sharedFolders.sharedWithEmail': userEmail }, 
        function(err, user) {
            if(err){
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success
                
                let sharedFoldersMetadata = [];
                for(let k=0; k<user.length; k++){
                    const sharedFolders = user[k].virtualdrive.sharedFolders 
                    for(let i=0; i<sharedFolders.length; i++){
                        if(sharedFolders[i].sharedWithEmail === userEmail){
                            for(let j=0; j<user[k].virtualdrive.folders.length; j++){
                                if(user[k].virtualdrive.folders[j].id.toString() === sharedFolders[i].virtualFolderId ){
                                    user[k].virtualdrive.folders[j].permissionIds = ['']
                                    sharedFoldersMetadata.push(user[k].virtualdrive.folders[j])
                                }
                            }
                        }
                    }
                }
                resolve(sharedFoldersMetadata)
                
            }
        })
    })

}

const getUsersOfGivenEmails = (emails) => {
    return new Promise(async(resolve, reject) => {
        let allUsers = []
        for(let i=0; i<emails.length; i++){
            if(emails[i] !== ''){
                const user = await User.findOne({email: emails[i]})
                if(user){
                    allUsers.push(user)
                }
            }
        }
        resolve(allUsers)
        
    })
}


 
const getTopParentFolderInfo = async (folderId) => {
    console.log(folderId)
    const user = await User.findOne({'virtualdrive.folders.id': mongoose.mongo.ObjectId(folderId)})
    if(user){
        const folders = user.virtualdrive.folders
        for(let i=0; i<folders.length; i++){
            if(folders[i].id.toString() === folderId){
                if(folders[i].virtualParent === 'root'){
                    return folders[i]
                }else{
                    /* console.log('virtua'+folders[i].virtualParent) */
                    return getTopParentFolderInfo(folders[i].virtualParent)
                }
            }
        }
    }else{
        console.log('error: gettopparentfolderinfo')
    }
   
}

export const deleteFolderObjectFromDatabase = (fileId, userEmail) => {
   
    return new Promise(async (resolve, reject) => { 
        //find top parent folder and access his permissions ids which results to shared emails
        const mongoFileId = new mongoose.mongo.ObjectId(fileId);
        let i;
        let allUsers = []
        let topParentInfo = await getTopParentFolderInfo(fileId)
        topParentInfo.permissionIds.push(topParentInfo.email)// also push the parent. saves from bugs
        allUsers = await getUsersOfGivenEmails(topParentInfo.permissionIds)
        
        /* console.log('before: '+allUsers) */

        //find that folder
        User.findOne/* AndUpdate */(
            {email: userEmail, 'virtualdrive.folders.id': mongoFileId},
            /* {$pull: {'virtualdrive.folders': {id: mongoFileId},}}  ,*/ async function(err, user) {
                if(err){
                    console.log(err)
                    reject(err)
                }else if(!user){
                    reject(`User ${userEmail} was not found in the database`)
                }else{//success 

                    let allFilesObj = {
                        'google-drive': [],
                        'onedrive': [],
                        'dropbox': []
                    }

                    console.log(allUsers)

                    
                    for(let j=0; j<allUsers.length; j++){

                        //await removeSharedWithMeEmail(userEmail, allUsers[j].email, fileId).catch(err => {/* console.log(err) */})

                        //for every shared user, delete shared folder from sharedFolders schema
                        await deleteSharedFolderFromDatabase(fileId, allUsers[j].email)
                        const filesObj = {
                            'google-drive': [],
                            'onedrive': [],
                            'dropbox': []
                        }

                        //find all the files that are included in this folder and arrange them in groups
                        for(i=0; i<allUsers[j].virtualdrive.files.length; i++){
                            allUsers[j].virtualdrive.files[i].aioDriveEmail = allUsers[j].email //add aio drive email for the token search in deletefile.js
                            if(allUsers[j].virtualdrive.files[i].drive === 'google-drive' && allUsers[j].virtualdrive.files[i].virtualParent === fileId){
                                filesObj['google-drive'].push(allUsers[j].virtualdrive.files[i])
                            }else if(allUsers[j].virtualdrive.files[i].drive === 'onedrive' && allUsers[j].virtualdrive.files[i].virtualParent === fileId){
                                filesObj['onedrive'].push(allUsers[j].virtualdrive.files[i])
                            }else if(allUsers[j].virtualdrive.files[i].drive === 'dropbox' && allUsers[j].virtualdrive.files[i].virtualParent === fileId){
                                filesObj['dropbox'].push(allUsers[j].virtualdrive.files[i])
                            }
                        }
                        
                        
                        const res = await deleteFolderContentsFromDatabase(fileId, allUsers[j].email).catch(err => {
                            console.log('error deleting mongo folder contents')
                        })

                        for(i=0; i<allUsers[j].virtualdrive.folders.length; i++){
                            if(allUsers[j].virtualdrive.folders[i].virtualParent === fileId){
                                //recursive delete each nested folder
                                const innerFilesObj = await deleteFolderObjectFromDatabase(allUsers[j].virtualdrive.folders[i].id.toString(), allUsers[j].email)
                                if(innerFilesObj){
                                    filesObj['google-drive'] = [...filesObj['google-drive'], ...innerFilesObj['google-drive']]
                                    filesObj['dropbox'] = [...filesObj['dropbox'], ...innerFilesObj['dropbox']]
                                    filesObj['onedrive'] = [...filesObj['onedrive'], ...innerFilesObj['onedrive']]
                                }
                            
                            }
                        }
                    
                        allFilesObj['google-drive'] = [...allFilesObj['google-drive'], ...filesObj['google-drive']]
                        allFilesObj['dropbox'] = [...allFilesObj['dropbox'], ...filesObj['dropbox']]
                        allFilesObj['onedrive'] = [...allFilesObj['onedrive'], ...filesObj['onedrive']]
                    }
                    //delete the top folder last
                    await User.findOneAndUpdate({email: userEmail, 'virtualdrive.folders.id': mongoFileId},
                        {$pull: {'virtualdrive.folders': {id: mongoFileId},}} ).catch(err => {
                            console.log(err)
                        })
                    resolve(allFilesObj) 
                } 
            }
        )   
    })
}

export const deleteSharedFolderFromDatabase = (fileId, userEmail) => {
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            {email: userEmail},
            {$pull: {'virtualdrive.sharedFolders': {virtualFolderId:fileId}}}, 
            function(err, user) {
                resolve()
            }
        )
    })
}


export const deleteFolderContentsFromDatabase = (virtualParent, userEmail) => {
    return new Promise((resolve, reject) => { 
        User.findOneAndUpdate(
            {email: userEmail, 'virtualdrive.files.virtualParent': virtualParent},
            {$pull: {'virtualdrive.files': {virtualParent: virtualParent}}} ,function(err, user) {
            if(err){
                console.log(err)
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success   
                resolve('OK')
            }
        })
    })
}

export const deleteFileFromVirtual = (fileId, userEmail) => {
    return new Promise((resolve, reject) => { 
        User.findOneAndUpdate(
            {email: userEmail, 'virtualdrive.files.id': fileId},
            {$pull: {'virtualdrive.files': {id: fileId}}} ,function(err, user) {
            if(err){
                console.log(err)
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success   
                resolve('OK')
            }
        })   
    })
}

export const renameFileObjectInDatabase = (fileId, newName, userEmail) => {
  
    fileId = new mongoose.mongo.ObjectId(fileId);
    
    return new Promise((resolve, reject) => { 
        if(newName.toLowerCase() === 'shared with me'){
            reject('This name is not allowed')
            return
        }
        User.findOneAndUpdate(
            {email: userEmail, 'virtualdrive.folders.id': fileId},
            {$set: {'virtualdrive.folders.$.name': newName}} ,function(err, user) {
            if(err){
                console.log(err)
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success   
                resolve('OK')
            }
        })   
    })
}

export const renameFileInVirtual  = (fileId, newName, userEmail) => {
  
    return new Promise((resolve, reject) => { 
        User.findOneAndUpdate(
            {email: userEmail, 'virtualdrive.files.id': fileId},
            {$set: {'virtualdrive.files.$.name': newName}} ,function(err, user) {
            if(err){
                console.log(err)
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success   
                resolve('OK')
            }
        })   
    })
}

export const getVirtualFolderFiles =  (folderId, userEmail, getOthers = true) => {

    return new Promise((resolve, reject) => {
        let otherFiles = [];

        if(folderId === undefined){ 
            folderId = 'root'
        }
            
        User.findOne({ email: userEmail }, async function(err, user) {
            if(err){
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{
                const folders = user.virtualdrive.folders.filter(folder => 
                    folder.virtualParent === folderId
                )
                let files = user.virtualdrive.files.filter(file => 
                    file.virtualParent === folderId
                )
                files = hideOtherSharedUsersFiles(files, userEmail)
                
                if(getOthers === true){
                    otherFiles = await getOtherUsersSharedFilesWithinYourSharedFolder(user, folderId)
                }
                resolve([...folders, ...files, ...otherFiles])
            }
        })
        
    })
}

export const pushFileToDatabase = (userEmail, fileMetadata) => {
    return new Promise(async (resolve, reject) => {

        User.findOneAndUpdate(
            {email: userEmail},
            {$push: {'virtualdrive.files': fileMetadata}},
            function(err) {
                if(err){
                    reject(err)
                }else{
                    resolve('OK')
                }
            }
        )
    })
}

export const pushVirtualFolderToDatabase = (folderObj, userEmail) => {
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            {email: userEmail},
            {$push: {'virtualdrive.folders': folderObj}},
            function(err) {
                if(err){
                    reject(err)
                }else{
                    resolve('OK')
                }
            }
        )
    })
}

export const pushRefreshedAccessTokenToDatabase = (newToken, userEmail, driveEmail, driveType) => {
    const queryEmail = driveType+'.email'
    const queryDrive = driveType+'.$.token'

    return new Promise((resolve, reject) => {
        newToken.date = Date.now()
        const token_str = encrypt(JSON.stringify(newToken))
        User.findOneAndUpdate(
            {email: userEmail, [queryEmail]:driveEmail}, 
            {$set: {[queryDrive]: token_str}},
            {upsert: true}, function(err) {  
                
                if(err){

                    reject('error pushing refreshed access token in database')
                }else{
                    resolve('OK')
                }
        
            }
        )
    })
}

export const getAllUserTokensFromDatabase = (userEmail, driveType) => {

    return new Promise((resolve, reject) => {
        User.findOne({ email: userEmail }, function(err, user) {
            if(err){
                reject(err)
            }else if(!user){
                reject(`User ${userEmail} was not found in the database`)
            }else{//success
                
                for(let i=0; i<user[driveType].length; i++){
                    user[driveType][i].token = decrypt(user[driveType][i].token)
                }
                resolve(user[driveType])
                /* resolve([...user["google-drive"], ...user["dropbox"]]) */
            }
        })
    })
}

export const addTokenToDatabase = (token, driveEmail, driveType, userEmail, res, aiofolder_id) => {
    let responseObj = {}
    token.date = Date.now()
    const token_str = encrypt(JSON.stringify(token))
   

    const driveTypeQuery = driveType+'.email'
    const tokenTypeQuery = driveType+'.$.token'
    const aioFolderQuery = driveType+'.$.aiofolder_id'
    User.findOneAndUpdate(

        {email: userEmail, [driveTypeQuery]: driveEmail}, 
        {$set: {[tokenTypeQuery]: token_str, [aioFolderQuery]: aiofolder_id}},
        {upsert: true},
        function(err) {
            
            if(err){
                const driveObj = {email: driveEmail, token: token_str, aiofolder_id: aiofolder_id }
                User.findOneAndUpdate(
                    {email: userEmail},
                    {$push: {[driveType]: driveObj}},
                    function(err) {
                        if(err){

                            responseObj = createJsonResponse('drive_add_failed','googledrive')
                            res.status(500).send(responseObj);
                        }else{

                            responseObj = createJsonResponse('drive_add_success','googledrive')
                            res.status(200).send(responseObj);
                        }
                    }
                )
            }else{

                responseObj = createJsonResponse('drive_update_success', 'googledrive')
                res.status(200).send(responseObj);
            }
    
        }
    ) 
}

export const getUserSharedFolderIdFromDatabase = (userEmail) => {
    return new Promise((resolve, reject) => {
        User.findOne({email: userEmail}, function(err, user){
            if(err || !user){
                console.log('getusersharedfolderidfromdatabase error')
                reject()
            }else{
                resolve(user.virtualdrive.folders[0].id.toString())
            }
        })
    })
}

export const setFileMetadataFromDatabase = (userEmail, fileId, fileMetadata) => {

    return new Promise((resolve, reject) => {
        User.findOneAndUpdate(
            {email: userEmail, 'virtualdrive.files.id': fileId},
            {$set: 
                {
                    'virtualdrive.files.$.id': fileMetadata.id,
                    'virtualdrive.files.$.name': fileMetadata.name,
                    'virtualdrive.files.$.email': fileMetadata.email,
                    'virtualdrive.files.$.drive': fileMetadata.drive,
                    'virtualdrive.files.$.path': fileMetadata.path,    
                }
            },
            {upsert: true}, 
            function(err, user){
                if(err || !user){
                    console.log(err)
                    reject('Error updating new file metadata')
                }else{
                    resolve()
                }
            }
        )
    })
}

export const getFileMetadataFromDatabase = (userEmail, fileId) => {
    return new Promise((resolve, reject) => {
        User.findOne({email: userEmail}, function(err, user){
            if(err || !user){
                console.log('getFileMetadataFromDatabase error')
                reject()
            }else{
                const files = user.virtualdrive.files
                for(let i=0; i<files.length; i++){
                    if(files[i].id === fileId){
                        resolve(files[i])
                    }
                }
            }
        })
    })
}
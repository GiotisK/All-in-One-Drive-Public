import React, { useState, useRef, useEffect, useContext } from "react";
import { useLocation } from 'react-router-dom'
import '../styles/DrivePage.css'
import TitleBanner from '../components/TitleBanner'
import MenuBanner from '../components/MenuBanner'
import DriveElement from '../components/DriveElement'
import FileRow from '../components/FileRow'
import Modal from '../components/Modal';
import Loader from '../components/Loader'
import { Redirect } from 'react-router-dom';
import { 
    myFetch, 
    parseUrlCode,  
    putExtraMetadataInFolder, 
    putExtraMetadataInFile,     
} from '../utilities/utilities'
import {
    mimeTypes,
    isVideo, 
    isAudio, 
    isImage, 
    isPdfOrTxt
} from '../utilities/MediaUtilities.js'
/* import { downloadFile } from '../utilities/DriveUtilities.js' */
import AddButtons from '../components/AddButtons'
import UploadModal from '../components/UploadModal';
import LoadingBar from '../components/LoadingBar'
import FileStack from '../utilities/FileStack'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import OpenFileModal from '../components/OpenFileModal'

let persistentFilesObjs = []
let fileForRename = {} //using the fileForRename var for both rename and share virtual folder
let fileForExport = {}
let fileForUpload = null;
let driveForUpload = {}
let driveForDelete = {}
let fileDropped = false
let filesDroppedInRoot = []
const fileStack = new FileStack()
const scrollStack = new FileStack()
const driveStack = new FileStack()
driveStack.setFiles('root')
let dragCounter = 0
let filesForPushLocal = []
let totalFilesBeingUploaded = 0
let currentFileNumBeingUploaded = 0
let scrollY = 0

export default function DrivePage() {
    const linkRef = React.createRef();
    let location = useLocation()
    const addDriveRef = useRef()
    const uploadFileButtonRef = useRef()
    const openFileModalRef = useRef()
    const toastRef = useRef()
    const uploadModalRef = useRef()
    const [uploadType, setUploadType] = useState(null) // 'file' or 'drive'
    const [checkboxChecked, setCheckboxChecked] = useState(true)
    const [modalType, setModalType] = useState('addDriveModal')
    const [deleteMode, setDeleteMode] = useState('')
    const [fileForDelete, setFileForDelete] = useState({})
    const [redirect, setRedirect] = useState()
    const [email, setEmail] = useState('')
    const [fileObjs, setFileObjs] = useState([])
    const [driveObjs, setDriveObjs] = useState([])
    const [renameInputText, setRenameInputText] = useState('')
    const [exportFileFormats, setExportFileFormats] = useState([])
    const [isLoading, setIsLoading] = useState({drives: true, files: true})
    const [isUploading, setIsUploading] = useState(false)
    const [uploadPercentage, setUploadPercentage] = useState({percentage:0, loaded:0, total:0, totalFilesBeingUploaded:0, currentFileNumBeingUploaded: 0})
    const [backButtonEnabled, setBackButtonEnabled] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [multipleFilePushTrigger, setMultipleFilePushTrigger] = useState(false)
    const [virtualDriveEnabled, setVirtualDriveEnabled] = useState(null)
    const [virtualQuota, setVirtualQuota] = useState(null)
    const [sharedWithEmails, setSharedWithEmails] = useState({fileId: '', permissionIds:[]})
    const [sideMenuDisplay, setSideMenuDisplay] = useState('none')
    const [openFileInfo, setOpenFileInfo] = useState(null)
    const [openFileModalType, setOpenFileModalType] = useState('')

    useEffect(() => {

        if(multipleFilePushTrigger) {
            const tempFilesForPushLocal = [...filesForPushLocal] //copy them so empty wont glitch
            filesForPushLocal = [] //empty them

            if(filesDroppedInRoot.length > 1){
                persistentFilesObjs = [...tempFilesForPushLocal, ...persistentFilesObjs]
                for(var i=0; i<driveObjs.length; i++){

                    if(driveObjs[i].email === tempFilesForPushLocal[0].email && driveObjs[i].driveName === tempFilesForPushLocal[0].drive && driveObjs[i].isActive){
                        const tempFileObjs = [...tempFilesForPushLocal, ...fileObjs]
                        /* tempFileObjs.unshift(tempFilesForPushLocal) */
                        fileStack.setHead(tempFilesForPushLocal)//also change the stack so if u go in next folder and then back, the newly added file should appear aswell 
                        setFileObjs(tempFileObjs)
                        break
                    }
                }
                filesDroppedInRoot = []
                setMultipleFilePushTrigger(false)
                setIsUploading(false)
            }else{
                setFileObjs([...tempFilesForPushLocal, ...fileObjs])
                fileStack.setHead(tempFilesForPushLocal) //also add to stack for the forward,back folder glitch
                setMultipleFilePushTrigger(false)
                setIsUploading(false)
            }
            totalFilesBeingUploaded = 0
            currentFileNumBeingUploaded = 0
           
        }
    }, [multipleFilePushTrigger])

    useEffect(()=> {
        const [authCode, driveType] = parseUrlCode(location.search)
        

        const body = JSON.stringify({authCode: authCode, driveType: driveType})
        let res;

        async function fetchData() {
            if(authCode !== '' && authCode !== undefined){
                res = await myFetch('authenticateDrive', 'POST', body).catch(err => {console.log(err)})
                res = JSON.parse(res)

                if(res.resType === 'drive_update_success' || res.resType === 'drive_add_success'){
                    window.location.replace('http://localhost:3000/drive')
                    getDriveFiles()
                }
            }

            const virtualDriveEnabledResponse = await myFetch('driveMode', 'GET').catch(err => {console.log(err)})
            myFetch('getVirtualQuota', 'GET').then((res)=>{
                setVirtualQuota(res)
            })
            res = await myFetch('checkToken', 'GET').catch(err => {console.log(err)})
            res = JSON.parse(res)
            if (res.resType === 'valid_token') {
                setEmail(res.resInfo)
                setRedirect('none')
 
                if(virtualDriveEnabledResponse === 'false'){
                    setVirtualDriveEnabled(false)
                    
                    getDriveFiles()
                }else{
                    setVirtualDriveEnabled(true)
                    let body = JSON.stringify({folderDrive: 'aio-drive'})
                    getDriveFiles(body)
                    
                }
                
            } else {
                setRedirect('unauthorized')
            }  
           
        }
        fetchData()
    }, [])

    async function getDriveFiles(body='') {
        
        setIsLoading({drives: true, files: true})
        let res  = await myFetch('getFiles', 'POST', body).catch(err => {console.log(err)})
        res = JSON.parse(res)
        persistentFilesObjs = [...res.resInfo[0]]
        fileStack.setFiles([...res.resInfo[0]])
        setFileObjs(res.resInfo[0])
        setDriveObjs(res.resInfo[1])
        setIsLoading({drives: false, files: false})

    }

    function selectDrive(key) {
        const allEqual = arr => arr.every( v => v.isActive === arr[0].isActive )
        let tempDriveObjs = [...driveObjs]
        tempDriveObjs[key].isActive = tempDriveObjs[key].isActive ? false : true

        if(allEqual(tempDriveObjs) && tempDriveObjs[0].isActive){
            setCheckboxChecked(true)
            setFileObjs(persistentFilesObjs)
        }else if(allEqual(tempDriveObjs) && !tempDriveObjs[0].isActive){
            setCheckboxChecked(false)
            setFileObjs([])
        }else{
            const unfilteredFiles = [...persistentFilesObjs]
            const filteredFiles = unfilteredFiles.filter(file => {
                for (var i=0; i<tempDriveObjs.length; i++){
                    if(tempDriveObjs[i].email === file.email && tempDriveObjs[i].driveName === file.drive && tempDriveObjs[i].isActive){
                        return file
                    }
                }
            })
            fileStack.setLastElement([...filteredFiles])
            setFileObjs(filteredFiles)
            setCheckboxChecked(false)
        }
        
        setDriveObjs(tempDriveObjs)
    }

 
    function selectAllDrives() {
        let tempDriveObjs = [...driveObjs]

        tempDriveObjs.forEach((obj)=>{
            obj.isActive = true
        })
        fileStack.setLastElement([...persistentFilesObjs])
        setDriveObjs(tempDriveObjs)
        setFileObjs(persistentFilesObjs)
        setCheckboxChecked(true)
    }

    function deselectAllDrives() {
        let tempDriveObjs = [...driveObjs]

        tempDriveObjs.forEach((obj)=>{
            obj.isActive = false
        })
        fileStack.setLastElement([])
        setDriveObjs(tempDriveObjs)
        setFileObjs([])
        setCheckboxChecked(false)
    }

    function onConnectedDrivesCheckboxClick() {
        if(checkboxChecked){
            deselectAllDrives()
        }else{
            selectAllDrives()
        }
    }

    function showAddDriveModal() {
        setModalType('addDriveModal')
        addDriveRef.current.showModal()
    }

    async function signOut() {
        driveStack.reset()
        driveStack.setFiles('root')//reseting the drivestack because after logout and login with another acc, the drivestack stays the same
        let res = await myFetch('logout', 'POST', '').catch(err => {console.log(err)})
        res = JSON.parse(res)
        if(res.resType === 'logout_success'){
            setRedirect('logout')
        }
    }
    

    async function onAddDriveClick(driveType) {
        let res = await myFetch(`connectDrive/${driveType}`, 'GET').catch(err => {console.log(err)})
        window.location.replace(res)
    }

    async function switchDriveMode(){

        const response = await myFetch('driveMode', 'PATCH', JSON.stringify({virtualDriveEnabled: !virtualDriveEnabled}))
        let body;

        if(virtualDriveEnabled === true && response === 'OK' ){
            setVirtualQuota(null)
            setVirtualDriveEnabled(false)
        }else if(virtualDriveEnabled === false && response === 'OK'){
            setVirtualDriveEnabled(true)
            setCheckboxChecked(true)
            myFetch('getVirtualQuota', 'GET').then((res)=>{
                setVirtualQuota(res)
            })
            body = JSON.stringify({folderDrive: 'aio-drive'})
        }
        setBackButtonEnabled(false)
        resetFileObjects()
        getDriveFiles(body)
    }

    function resetFileObjects() {
        persistentFilesObjs = []
        setFileObjs([])
        setDriveObjs([])
        fileStack.reset()
        driveStack.reset()
        driveStack.setFiles('root')
    }

    function onDeleteFileClick(name, id, email, driveType, path) {
  
        setFileForDelete({name, id, email, driveType, path})
        setModalType('deleteModal')
        setDeleteMode('file')
        addDriveRef.current.showModal()
    }

    async function deleteFile(){
        
        addDriveRef.current.hideModal()  
        const {id, name, email, driveType, path} = fileForDelete
        const body = JSON.stringify({fileId: id, fileName: name, fileEmail: email, driveType: driveType, path: path})
   /*      setFileForDelete({}) */
        let res = await myFetch('deleteFile', 'POST', body).catch(err => {console.log(err)})
        if(res === 'OK'){
            toast.success("File delete successful!")
            //remove files from persistent var first
            persistentFilesObjs = persistentFilesObjs.filter((file) => {
                if(file.id !== id){
                    return file
                }
            })
            //then from the state var (needs to be done cause of filters applied prolly)
            let tempFileObjs = [...fileObjs]
            tempFileObjs = tempFileObjs.filter((file) => {
                if(file.id !== id){
                    return file
                }
            })
            //must also remove from stack
            if(fileStack.head() !== 'root'){
                fileStack.removeFile(id)
            }
            
            setFileObjs(tempFileObjs)
        
        }else{
            toast.error("Delete failed.")
        }
    }

    async function onDownloadFileClick(formatLinks, fileId, fileName, fileEmail, fileType, driveType, fileExtension, openFile=false) {
        let body = JSON.stringify({driveEmail: fileEmail, driveType: driveType })
        let res, accessToken;
        if(driveType === 'aio-drive'){   
            toastRef.current = toast.warning('Fetching shared file link...', {autoClose: false})
        }else{
            toastRef.current = toast.warning('Fetching file data...', {autoClose: false})
        }
        switch(driveType){
            case 'google-drive':
                if(formatLinks){
                    fileForExport = {fileId, fileName, fileEmail, driveType}
                    showExportFormatModal(formatLinks)
                }else{
                    let res = await myFetch('getAccessToken', 'POST', body).catch(err => {console.log(err)})
                    res = JSON.parse(res)
                    accessToken = res.resInfo
                    fetch("https://www.googleapis.com/drive/v3/files/"+fileId+"?alt=media" , {
                        method: 'GET',
                        headers: {
                            'Content-length': 0,
                            'Authorization': 'Bearer '+accessToken,
                        },
                    })
                    .then(async (res) => {
                        if(res.status === 200){
                            const blob = await res.blob()
                            toast.dismiss(toastRef.current)
                            const href = window.URL.createObjectURL(blob);

                            if(openFile === true && isAudio(fileExtension)){
                                setOpenFileInfo({src: href, extension: fileExtension})
                                setOpenFileModalType('audio')
                                openFileModalRef.current.showModal()
                            }else if(openFile === true && isVideo(fileExtension)){
                                setOpenFileInfo({src: href, extension: fileExtension})
                                setOpenFileModalType('video')
                                openFileModalRef.current.showModal()
                            }else if(openFile === true && isImage(fileExtension)){ 
                                setOpenFileInfo({src: href, extension: fileExtension})
                                setOpenFileModalType('image')
                                openFileModalRef.current.showModal()
                            }else if(openFile === true && isPdfOrTxt(fileExtension)){
                                window.open(href, '_blank')
                            }else{
                                const a = linkRef.current;
                                a.download = fileName;
                                a.href = href;
                                a.click();
                                a.href = '';
                            }
                           
            
                        }else{
                            console.log(res.status)
                        }
                    }).catch(err => console.log(err))
        
                }
                break
            case 'dropbox':
                
                res = await myFetch('getAccessToken', 'POST', body).catch(err => {console.log(err)})
                res = JSON.parse(res)
                accessToken = res.resInfo
                const extraUri = (fileType === 'folder' ? '_zip' : '') //folders need another api call
                fetch("https://content.dropboxapi.com/2/files/download"+extraUri, {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer '+accessToken,
                            'Dropbox-API-Arg':JSON.stringify({path: fileId})
                        },
                    })
                    .then(async (res) => {
                        
                        if(res.status === 200){      
                          
                            let blob = await res.blob()
                            toast.dismiss(toastRef.current) 
                            blob = blob.slice(0, blob.size, mimeTypes[fileExtension.replace('.', '')])
                            const href = window.URL.createObjectURL(blob);
                    
                           
                            if(openFile === true && isAudio(fileExtension)){
                                setOpenFileInfo({src: href, extension: fileExtension})
                                setOpenFileModalType('audio')
                                openFileModalRef.current.showModal()
                            }else if(openFile === true && isVideo(fileExtension)){
                                setOpenFileInfo({src: href, extension: fileExtension})
                                setOpenFileModalType('video')
                                openFileModalRef.current.showModal()
                            }else if(openFile === true && isImage(fileExtension)){
                                setOpenFileInfo({src: href, extension: fileExtension})
                                setOpenFileModalType('image')
                                openFileModalRef.current.showModal()
                            }else if(openFile === true && isPdfOrTxt(fileExtension)){
                                window.open(href, '_blank')
                            }else{
                                const a = linkRef.current;
                                a.download = fileName;
                                a.href = href;
                                a.click();
                                a.href = '';
                            }

                        }else{
                            console.log(res.status)
                        }
                    }).catch(err => console.log(err))
               
                break
            case 'onedrive':
                res = await myFetch('getAccessToken', 'POST', body).catch(err => {console.log(err)})
                res = JSON.parse(res)
                accessToken = res.resInfo
                fetch('https://graph.microsoft.com/v1.0/users/me/drive/items/'+fileId+'/content', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer '+accessToken,
                    },
                })
                .then(async (res) => {
                    
                    if(res.status === 200){
                         
                        const blob = await res.blob()
                        toast.dismiss(toastRef.current) 
                        const href = window.URL.createObjectURL(blob);
                        

                        if(openFile === true && isAudio(fileExtension)){
                            setOpenFileInfo({src: href, extension: fileExtension})
                            setOpenFileModalType('audio')
                            openFileModalRef.current.showModal()
                        }else if(openFile === true && isVideo(fileExtension)){
                            setOpenFileInfo({src: href, extension: fileExtension})
                            setOpenFileModalType('video')
                            openFileModalRef.current.showModal()
                        }else if(openFile === true && isImage(fileExtension)){ 
                            setOpenFileInfo({src: href, extension: fileExtension})
                            setOpenFileModalType('image')
                            openFileModalRef.current.showModal()
                        }else if(openFile === true && isPdfOrTxt(fileExtension)){
                            window.open(href, '_blank')
                        }else{
                            const a = linkRef.current;
                            a.download = fileName;
                            a.href = href;
                            a.click();
                            a.href = '';
                        }
                    }else{
                        console.log(res.status)
                    }
                }).catch(err => console.log(err))

                break

            case 'aio-drive':

                body = JSON.stringify({fileId, driveEmail: fileEmail})
                res = await myFetch('getSharedFileLink', 'POST', body).catch(err => {console.log(err)})
                toast.dismiss(toastRef.current) 
                res = res.replace('dropbox:', '')
                res = res.replace('onedrive:', '')
                res = res.replace('google-drive:', '')
                window.open(res, '_blank')
                break
        }
    }

    function showExportFormatModal(formatLinks) {
        const formats = findExportFormats(formatLinks)
        setExportFileFormats(formats)
        setModalType('exportModal')
        addDriveRef.current.showModal()
    }

    async function onExportFormatClick(format) {
        toast.dismiss(toastRef.current) 
        let body = JSON.stringify({driveEmail: fileForExport.fileEmail, driveType: fileForExport.driveType })
        let res = await myFetch('getAccessToken', 'POST', body).catch(err => {console.log(err)})
        res = JSON.parse(res)
        const accessToken = res.resInfo
        fetch("https://www.googleapis.com/drive/v3/files/"+fileForExport.fileId+"/export?mimeType="+mimeTypes[format] , {
            method: 'GET',
            headers: {
                'Content-length': 0,
                'Authorization': 'Bearer '+accessToken,
            },
        })
        .then(async (res) => {
            if(res.status === 200){
                const blob = await res.blob()
                const href = window.URL.createObjectURL(blob);
                const a = linkRef.current;
                a.download = fileForExport.fileName+'.'+format;
                a.href = href;
                a.click();
                a.href = '';

            }else{
                console.log(res.status)
            }
        }).catch(err => console.log(err))
        addDriveRef.current.hideModal()
    }
    
    function findExportFormats(formatLinks) {
        const extensions = []
        Object.values(formatLinks).forEach(formatUri => {
            const splits = formatUri.split('=')
            extensions.push(splits[splits.length-1])
        })
        return extensions
        
    }

    async function handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
        setUploadType('file')
        dragCounter = 0
        fileDropped = true
        const files = [...e.dataTransfer.files]
        if(files.length === 0 ){
            return
        }
        const userSharedFolderId = await myFetch('getUserSharedFolderId', 'GET')
        if(userSharedFolderId === driveStack.head().parent){
            toast.error("You can't upload directly in this folder")
            return
        }

        //FLOW: if in root and drag and dropped file, open the select drive modal
        //after selecting the drive, upload to root

        if(driveStack.head() === 'root' && virtualDriveEnabled === false){
            if(files.length === 1){
                fileForUpload = files[0]
                //maybe set something here and then 
            }else{
                filesDroppedInRoot = [...files]
            }
         
            uploadModalRef.current.showModal()
        }else{
            //FLOW: if inside a folder, set the Driveforupload and upload the files in there
            driveForUpload = {driveEmail: driveStack.head().email, driveType: driveStack.head().drive}
            totalFilesBeingUploaded = files.length
            for(var i=0; i<files.length; i++){
                currentFileNumBeingUploaded = i+1
                await onOpenFileClick(null, files[i], true).catch(err=>{console.log(err)})
            }
            setMultipleFilePushTrigger(true)
        }
       
    }

    function handleDragOver(e){
        e.preventDefault()
        e.stopPropagation()
    }

    function handleDragEnter(e){ 
        e.preventDefault()
        e.stopPropagation()
        dragCounter++
        if(e.dataTransfer.items && e.dataTransfer.items.length >0){
            setDragging(true)
        }
    }

    function handleDragLeave(e){    
        e.preventDefault()
        e.stopPropagation()
        dragCounter--
        if(dragCounter > 0 ) return
        setDragging(false)

    }

    function onUploadClick(type){
        setUploadType(type) //set 'file' or 'folder' for correct modal text

        if(virtualDriveEnabled === true){
            if(type === 'folder'){
                createVirtualFolder()
            }else if(type === 'file'){
                uploadFileButtonRef.current.openPicker()
            }
        }else if(driveStack.head() === 'root'){
            //if in root, select which drive to upload to
            uploadModalRef.current.showModal()
        }else{
            //if inside folder, u already know the current drive
            driveForUpload = {driveEmail: driveStack.head().email, driveType: driveStack.head().drive}
            if(type === 'file'){
                uploadFileButtonRef.current.openPicker()
            }else if (type === 'folder'){
                createFolder()//upload the actual folder
            }
            
        }
    }

    async function setDriveForUpload(drive){
        driveForUpload = {driveEmail: drive.email, driveType: drive.driveName}
        if(uploadType === 'folder'){
            createFolder()
            
            return
        }
        if(!fileDropped){
            
            uploadFileButtonRef.current.openPicker()
        }else{//if item was drag n dropped, do not open file picker
            fileDropped = false

            //filesdroppedinroot fills when multiple files are dropped in root dir
            totalFilesBeingUploaded = filesDroppedInRoot.length
            if(filesDroppedInRoot.length > 1){
                for(var i=0; i<filesDroppedInRoot.length; i++){
                    currentFileNumBeingUploaded = i+1
                    await onOpenFileClick(null, filesDroppedInRoot[i], true).catch(err=>{console.log(err)})
                }
                
                setMultipleFilePushTrigger(true)
                
            }else{
                onOpenFileClick(null, fileForUpload)
            }
            
            //if item was drag n dropped, call automatically the onOpenFileClick func
            
        }
        
    }

    function onOpenFileClick(event, file, isMultipleFiles=false){
        if(event !== null){
            event.persist()//must persist event, else cant use it in an asynchronous way like inside a promise.
        }
        return new Promise(async (resolve, reject) => {

            const userSharedFolderId = await myFetch('getUserSharedFolderId', 'GET')
            if(userSharedFolderId === driveStack.head().parent){
                toast.error("You can't upload directly in this folder")
                return
            }
            
            //manual upload
            if(file === undefined){
                file = event.target.files[0];
                event.target.value = '' //reset the event cause wont trigger the upload on same file
               
            }//else upload with drag n drop

            let blob = new Blob([file])
            var metadata = {
                name: file.name,
                mimeType: file.type,
            }
            let body;

            if(virtualDriveEnabled === true){

                //if virtualdriveenabled -> get ideal drive, set drive for upload, and follow the normal flow
                
                let idealDriveObj = await myFetch('getIdealDrive', 'POST', JSON.stringify({fileSize: file.size}))
                idealDriveObj = JSON.parse(idealDriveObj)
                if(Object.keys(idealDriveObj).length === 0){
                    toast.error('No connected drives were found!')
                    return
                }else{
                    toast.warning('Finding ideal drive for upload...')
                }
                
                driveForUpload = {driveEmail: idealDriveObj.email, driveType: idealDriveObj.driveType }
                metadata.parents = [idealDriveObj.aiofolder_id]

            }else{
                if(driveStack.head() !== 'root'){// we are inside a folder
                    metadata.parents = [driveStack.head().parent]
                }
            }
            body = JSON.stringify({driveEmail: driveForUpload.driveEmail, driveType: driveForUpload.driveType })                
            let res = await myFetch('getAccessToken', 'POST', body).catch(err => {console.log(err)})
            res = JSON.parse(res)
            const accessToken = res.resInfo
            /*axios here because fetch doesn't support progress bar*/
            switch(driveForUpload.driveType){
                case "google-drive":
                    axios({
                        method: 'post',
                        url: "https://www.googleapis.com/drive/v3/files",
                        headers: {
                            'Content-type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': 'Bearer '+accessToken,
                        },
                        data: JSON.stringify(metadata),
                    }).then((res)=>{
                        res = res.data
                        setIsUploading(true)
                        
                        axios({
                            method: 'PATCH',
                            url: `https://www.googleapis.com/upload/drive/v3/files/${res.id}`,
                            headers: {
                                'Authorization': 'Bearer '+accessToken,
                                'Content-Type': file.type
                            },
                            data: blob,
                            onUploadProgress: (progressEvent) => {
                                let {loaded, total} = progressEvent;
                                let percentage = Math.floor(loaded * 100 / total)
                                loaded = (loaded/1000000).toFixed(2)
                                total = (total/1000000).toFixed(2)
                                setUploadPercentage({percentage, loaded, total, totalFilesBeingUploaded, currentFileNumBeingUploaded })
                                /* console.log(`${loaded}kb of ${total}kb | ${percentage}`) */
                            }
                        }).then(res => {
                            toast.success("Upload successful!") 
                            handleUploadedFile(res, driveForUpload, null, isMultipleFiles, file.size)
                            resolve()

                        }).catch((err)=>{reject(err); console.log(err)});
        
                    }).catch(err => {reject(err); console.log(err)})
                    break

                case 'dropbox':
                    let path;
                    let pathWithoutName;
                    if(virtualDriveEnabled === true){
                        path = '/aio drive/'+file.name
                        pathWithoutName = '/aio drive/'
                    }else{
                        if(driveStack.head() === 'root'){
                            path = '/'+file.name
                            pathWithoutName = '/'
                        }else{
                            path = driveStack.head().path+'/'+file.name
                            pathWithoutName = driveStack.head().path+'/'
                        }
                    }
                   
                    setIsUploading(true)
                    axios({
                        method: 'POST',
                        url: 'https://content.dropboxapi.com/2/files/upload',
                        headers: {
                            'Authorization': 'Bearer '+accessToken,
                            'Content-Type': 'application/octet-stream',
                            'Dropbox-API-Arg': JSON.stringify({
                                path: path,
                                mode: "add",
                                autorename: true,
                                mute: false,
                                strict_conflict: false
                            })
                        },
                        data: blob,
                        onUploadProgress: (progressEvent) => {
                            let {loaded, total} = progressEvent;
                            let percentage = Math.floor(loaded * 100 / total)
                            loaded = (loaded/1000000).toFixed(2)
                            total = (total/1000000).toFixed(2)
                            setUploadPercentage({percentage, loaded, total, totalFilesBeingUploaded, currentFileNumBeingUploaded })
                            /* console.log(`${loaded}kb of ${total}kb | ${percentage}`) */
                        }
                    }).then(res => {
                        toast.success("Upload successful!")
                        handleUploadedFile(res, driveForUpload, pathWithoutName, isMultipleFiles, file.size)
                        resolve()
                    })
                    break

                case "onedrive":
                    let url = ''
                    if(virtualDriveEnabled === true){
                        url = 'https://graph.microsoft.com/v1.0/users/me/drive/items/'+metadata.parents[0]+':/'+file.name+':/content'
                    }else{
                        if(driveStack.head() === 'root'){
                            url = 'https://graph.microsoft.com/v1.0/users/me/drive/root:/'+file.name+':/content'
                        }else{
                            url = 'https://graph.microsoft.com/v1.0/users/me/drive/items/'+driveStack.head().parent+':/'+file.name+':/content'
                        }
                    }
                    setIsUploading(true)
                    axios({
                        method: 'PUT',
                        url: url,
                        headers: {
                            'Authorization': 'Bearer '+accessToken,
                            'Content-Type': 'file.type',
                        },
                        data: blob,
                        onUploadProgress: (progressEvent) => {
                            let {loaded, total} = progressEvent;
                            let percentage = Math.floor(loaded * 100 / total)
                            loaded = (loaded/1000000).toFixed(2)
                            total = (total/1000000).toFixed(2)
                            setUploadPercentage({percentage, loaded, total, totalFilesBeingUploaded, currentFileNumBeingUploaded })
                            /* console.log(`${loaded}kb of ${total}kb | ${percentage}`) */
                        }
                    }).then(res => {
                        toast.success("Upload successful!")
                        handleUploadedFile(res, driveForUpload, null, isMultipleFiles, file.size)
                        resolve()
                    })
                    break      
            }
           
            uploadModalRef.current.hideModal()
        })

    }

    function handleUploadedFile(res, driveForUpload, dropboxPath, isMultipleFiles, fileSize){
        if(res.status === 200 || res.status === 201){
            let responseFileInfo = res.data
            let uploadedFile = {}
            if(driveForUpload.driveType  === 'google-drive'){
                uploadedFile = responseFileInfo
                uploadedFile.permissionIds = ['']
                uploadedFile.size = fileSize
            }else if(driveForUpload.driveType === 'onedrive'){
                uploadedFile = {
                    id: responseFileInfo.id,
                    name: responseFileInfo.name,
                    path: '',
                    permissionIds: responseFileInfo.shared ? ['shared'] : [''],
                    size: fileSize
                }
            }else if(driveForUpload.driveType  === 'dropbox'){
                uploadedFile = {
                    id: responseFileInfo.id,
                    name: responseFileInfo.name,
                    path: dropboxPath,
                    permissionIds: [''],
                    size: fileSize
                }
                
            }
  
            uploadedFile = putExtraMetadataInFile(uploadedFile, driveForUpload)
            
            filesForPushLocal.unshift(uploadedFile)
            if(!isMultipleFiles){
                setTimeout(function(){setIsUploading(false)}, 1000);
                pushUploadedFileToLocalArray(uploadedFile)
            }
            if(virtualDriveEnabled === true){
                uploadedFile.virtualParent = (driveStack.head() === 'root' ? 'root' : driveStack.head().parent)
                myFetch('uploadVirtual', 'POST', JSON.stringify({fileMetadata: uploadedFile}) )
            }
        }
    }

    function pushUploadedFileToLocalArray(responseFileInfo){
        
        //only push to persistent files (the files in root) only if you upload on root
        if(driveStack.head() === 'root'){
            persistentFilesObjs.unshift(responseFileInfo)
        }
        if(virtualDriveEnabled === true){
            //refactor needed
           
            const tempFileObjs = [...fileObjs]
            tempFileObjs.unshift(responseFileInfo)
            fileStack.setHead([responseFileInfo])//also change the stack so if u go in next folder and then back, the newly added file should appear aswell 
            setFileObjs(tempFileObjs)
        }else{
            for(var i=0; i<driveObjs.length; i++){

                if(driveObjs[i].email === responseFileInfo.email && driveObjs[i].driveName === responseFileInfo.drive && driveObjs[i].isActive){
                    const tempFileObjs = [...fileObjs]
                    tempFileObjs.unshift(responseFileInfo)
                    fileStack.setHead([responseFileInfo])//also change the stack so if u go in next folder and then back, the newly added file should appear aswell 
                    setFileObjs(tempFileObjs)
                    break
                }
            }
        }
    }

    function onRenameFileClick(name, id, email, driveType, path) {
      
        fileForRename = {id, name, email, driveType, path}
        setModalType('renameModal')
        setRenameInputText(name)
        addDriveRef.current.showModal()
    }

    function onRenameChange(event) {   
        setRenameInputText(event.target.value) 
    }

    async function renameFile(){
        
        const {id, name, email, driveType, path} = fileForRename
        let body = JSON.stringify({fileId: id, fileName: name, fileEmail: email, driveType: driveType, newName: renameInputText, path: path})
        let res = await myFetch('renameFile', 'POST', body).catch(err => {console.log(err)})

        if(res === 'OK'){
            toast.success("Rename successful!")
            //update name in the persistent var first
            for(var i=0; i<persistentFilesObjs.length; i++){
                if(persistentFilesObjs[i].id === id){
                    persistentFilesObjs[i].name = renameInputText
                }
                
            }

            //then from the state var (needs to be done cause of filters applied prolly)
            let tempFileObjs = [...fileObjs]
            for(var i=0; i<tempFileObjs.length; i++){
                if(tempFileObjs[i].id === id){
                    tempFileObjs[i].name = renameInputText
                }
                
            }
            addDriveRef.current.hideModal()
            setFileObjs(tempFileObjs)               
        }else{
            toast.error("Rename failed.")
        }
    }

    async function unshareVirtualFolder(email) {
    
        const body = JSON.stringify({fileId: sharedWithEmails.fileId, driveType: 'aio-drive', sharedWithEmail: email })
        const res = await myFetch('shareFile', 'DELETE', body)
        let tempSharedWithEmails = {fileId: sharedWithEmails.fileId, permissionIds:[...sharedWithEmails.permissionIds]};
       
        if(res === 'OK'){
            let index;
            index = tempSharedWithEmails.permissionIds.indexOf(email)
            tempSharedWithEmails.permissionIds.splice(index, 1)
            setSharedWithEmails(tempSharedWithEmails) //
            
            for(let i=0; i<persistentFilesObjs.length; i++){
                if(persistentFilesObjs[i].id === sharedWithEmails.fileId){
                    index = persistentFilesObjs[i].permissionIds.indexOf(email)
                    persistentFilesObjs[i].permissionIds.splice(index, 1)
                    break
                }
            }
            let tempFileObjs = [...fileObjs]
            for(let i=0; i<tempFileObjs.length; i++){
                if(tempFileObjs[i].id === sharedWithEmails.fileId && tempFileObjs[i].permissionIds.includes(email)){
                    index = tempFileObjs[i].permissionIds.indexOf(email)
                    tempFileObjs[i].permissionIds.splice(index, 1)
                }
            }
            setFileObjs(tempFileObjs)
            if(tempSharedWithEmails.permissionIds.length === 1 && tempSharedWithEmails.permissionIds[0] === ''){
                uploadModalRef.current.hideModal()
            }
        }

    }

    async function shareVirtualFolder(){
        const body = JSON.stringify({fileId: fileForRename.fileId, driveType: 'aio-drive', sharedWithEmail: renameInputText})
        const res = await myFetch('shareFile', 'POST', body)
        if(res === 'OK'){
            for(var i=0; i<persistentFilesObjs.length; i++){
                if(persistentFilesObjs[i].id === fileForRename.fileId && !persistentFilesObjs[i].permissionIds.includes(renameInputText)){
                    persistentFilesObjs[i].permissionIds.push(renameInputText)
                }
            }

            let tempFileObjs = [...fileObjs]
            for(var i=0; i< tempFileObjs.length; i++){
                if( tempFileObjs[i].id === fileForRename.fileId && !tempFileObjs[i].permissionIds.includes(renameInputText)){
                    tempFileObjs[i].permissionIds.push(renameInputText)
                }
            }
            setFileObjs(tempFileObjs)

        }
        addDriveRef.current.hideModal()
        
    }

    function onDeleteDriveClick(e, email, type) {
        e.stopPropagation();
        driveForDelete = {email, type}
        setModalType('deleteModal')
        setDeleteMode('drive')
        addDriveRef.current.showModal()
    }

    async function deleteDrive() {
        const {email, type} = driveForDelete
        let body = JSON.stringify({driveType: type, driveEmail: email})
        let res = await myFetch('deleteDrive', 'POST', body).catch(err => {console.log(err)})
        if(res === 'OK'){
            toast.success('Drive delete successful!')
            //update drives that are being shown
            let tempDriveObjs = [...driveObjs]
            tempDriveObjs = tempDriveObjs.filter((drive) => {
                if( (drive.email !== email && drive.driveName === type) || (drive.email === email && drive.driveName  !== type) || (drive.email !== email && drive.driveName !== type)  ){
                    return drive
                }
            })

            //update name in the persistent var first
            persistentFilesObjs = persistentFilesObjs.filter((file) => {
                if( (file.email !== email && file.drive === type) || (file.email === email && file.drive !== type) || (file.email !== email && file.drive !== type)){
                    return file
                }
            })

            //then from the state var (needs to be done cause of filters applied prolly)
            let tempFileObjs = [...fileObjs]
            tempFileObjs = tempFileObjs.filter((file) => {
                if( (file.email !== email && file.drive === type) || (file.email === email && file.drive !== type) || (file.email !== email && file.drive !== type)){
                    return file
                }
            })

            addDriveRef.current.hideModal()  
            setDriveObjs(tempDriveObjs)
            setFileObjs(tempFileObjs)
        }
        
    }

    async function onFileClick(file){
        saveScrollPosition()

        if(file.type === 'folder' && isUploading === false){
            let tempIsLoading = {...isLoading}
            tempIsLoading.files = true
            setIsLoading(tempIsLoading)
            let body = JSON.stringify({folderId: file.id, folderDrive: file.drive, folderEmail: file.email, folderName: file.name, path: file.path})
            let res  = await myFetch('getFiles', 'POST', body).catch(err => {console.log(err)})
            res = JSON.parse(res)
            fileStack.push(res.resInfo)
          
            driveStack.push({parent: file.id, email: file.email, drive: file.drive, path: file.path+file.name})

            setBackButtonEnabled(true)
            setFileObjs(res.resInfo)
            tempIsLoading = {...isLoading}
            tempIsLoading.files = false
            setIsLoading(tempIsLoading)
        }else if(file.type === 'file' /* && virtualDriveEnabled === true */){
            onDownloadFileClick(null, file.id, file.name, file.email, 'file', file.drive, file.extension, true)
        }
    }

    function saveScrollPosition() {
        scrollStack.push(document.querySelector('.scrollview').scrollTop)
        /* scrollY = document.querySelector('.scrollview').scrollTop */
    }

    function onBackButtonClick(){
        
        fileStack.pop()
        driveStack.pop()

        if(fileStack.getFiles().length === 1){
            setBackButtonEnabled(false)
        }
        setFileObjs(fileStack.head())
        setTimeout(()=>{
            scrollToPreviousPosition()
        }, 100)
        
    }

    function scrollToPreviousPosition() {
        document.querySelector('.scrollview').scrollTop = scrollStack.head()
        scrollStack.pop()
    }

    async function createVirtualFolder() {
        const userSharedFolderId = await myFetch('getUserSharedFolderId', 'GET')

        if(userSharedFolderId === driveStack.head().parent){// restrict folder creation inside user's shared folder
            toast.error("You can't create a new folder here.")
            return
        }
        const parentId = driveStack.head() === 'root' ? 'root' : driveStack.head().parent
        const body = {parentId: parentId, driveEmail: '', driveType: 'aio-drive', path: ''}
        let res = await myFetch('createFolder', 'POST', JSON.stringify(body))
        try{
            res = JSON.parse(res)
            pushUploadedFileToLocalArray(res)
            toast.success("Virtual folder created!")
           /*  persistentFilesObjs.push(res)
            let tempFileObjs = [...persistentFilesObjs]
            setFileObjs(tempFileObjs) */

        }catch(err){
            console.log(err)
        }
    }

    async function createFolder() {
        const body = {parentId: '', driveEmail: driveForUpload.driveEmail, driveType: driveForUpload.driveType, path: '/'}
        if(driveStack.head() !== 'root'){
            switch(driveForUpload.driveType){
                case "google-drive":
                case "onedrive":
                    body.parentId = driveStack.head().parent
                    break

                case "dropbox":
                    body.path = driveStack.head().path
                    break
                
            }
            
        }
        
        let res = await myFetch('createFolder', 'POST', JSON.stringify(body))
        res = JSON.parse(res)
        if(res.resType === 'create_folder_success'){
            let responseFileInfo = putExtraMetadataInFolder(res.resInfo, driveForUpload)
            pushUploadedFileToLocalArray(responseFileInfo)
        }
        
        uploadModalRef.current.hideModal()
        
    }

    async function onShareFileClick(fileId, fileName, fileEmail, driveType, path, isShared, sharedLink, permissionIds){
  
        const body = JSON.stringify({fileId: fileId, fileName: fileName, driveEmail: fileEmail, driveType: driveType, path: path, sharedLink: sharedLink})
        let res;

        if(isShared){//remove share link

            if(virtualDriveEnabled === true && driveType === 'aio-drive'){
                setUploadType('virtual_unshare')
                setSharedWithEmails({fileId, permissionIds: [...permissionIds]})
                setTimeout(()=>{
                    uploadModalRef.current.showModal()
                }, 300)
                
            }else{
                res = await myFetch('shareFile', 'delete', body)

                if(res === 'OK' && driveType === 'google-drive'){
                    for(var i=0; i<persistentFilesObjs.length; i++){
                        if(persistentFilesObjs[i].id === fileId){
                            const index = persistentFilesObjs[i].permissionIds.indexOf('anyoneWithLink')
                            persistentFilesObjs[i].permissionIds.splice(index, 1)
                        }
                    }

                    let tempFileObjs = [...fileObjs]
                    for(var i=0; i< tempFileObjs.length; i++){
                        if( tempFileObjs[i].id === fileId && tempFileObjs[i].permissionIds.includes('anyoneWithLink')){
                            const index = tempFileObjs[i].permissionIds.indexOf('anyoneWithLink')
                            tempFileObjs[i].permissionIds.splice(index, 1)  
                        }
                    }
                    setFileObjs(tempFileObjs)


                }else if(res === 'OK' && driveType === 'dropbox'){
                    for(var i=0; i<persistentFilesObjs.length; i++){
                        if(persistentFilesObjs[i].id === fileId){
                            persistentFilesObjs[i].permissionIds[0] = ''
                        }
                    }

                    let tempFileObjs = [...fileObjs]
                    for(var i=0; i< tempFileObjs.length; i++){
                        if( tempFileObjs[i].id === fileId && tempFileObjs[i].permissionIds[0].includes('dropbox')){
                            tempFileObjs[i].permissionIds[0] = '' 
                            break
                        }
                    }
                
                    setFileObjs(tempFileObjs)
                }else if(res === 'OK' && driveType === 'onedrive'){
                    for(var i=0; i<persistentFilesObjs.length; i++){
                        if(persistentFilesObjs[i].id === fileId){
                            persistentFilesObjs[i].permissionIds[0] = ''
                        }
                    }

                    let tempFileObjs = [...fileObjs]
                    for(var i=0; i< tempFileObjs.length; i++){
                        if( tempFileObjs[i].id === fileId && ( tempFileObjs[i].permissionIds[0].includes('onedrive') || tempFileObjs[i].permissionIds[0].includes('shared')  ) ){
                            tempFileObjs[i].permissionIds[0] = '' 
                            break
                        }
                    }
                    setFileObjs(tempFileObjs)
                }else{
                    toast.error("File unshare failed.")
                }
            }
            
        }else{//add share link
            if(virtualDriveEnabled === true && driveType === 'aio-drive'){
                setModalType('shareVirtualModal')
                setRenameInputText('')
                addDriveRef.current.showModal()
                fileForRename.fileId = fileId

            }else{
                res = await myFetch('shareFile', 'POST', body)
                if(res.includes('google-drive')){

                    //we must put the updated file everywhere
                    for(var i=0; i<persistentFilesObjs.length; i++){
                        if(persistentFilesObjs[i].id === fileId){
                            persistentFilesObjs[i].permissionIds.push('anyoneWithLink')
                        }
                    }
                    //update the current fileObjs
                    let tempFileObjs = [...fileObjs]
                    for(var i=0; i< tempFileObjs.length; i++){
                        if( tempFileObjs[i].id === fileId && !tempFileObjs[i].permissionIds.includes('anyoneWithLink')){
                            tempFileObjs[i].permissionIds.push('anyoneWithLink')   
                        }
                    }
                    setFileObjs(tempFileObjs)
                    
                    //!!!!!no need to set the filestack, cause the filestack has the reference of the fileobjs set ;)
                }else if(res.includes('dropbox')){
    
                    for(var i=0; i<persistentFilesObjs.length; i++){
                        if(persistentFilesObjs[i].id === fileId){
                            persistentFilesObjs[i].permissionIds[0] = res   
                        }
                    }
                    //update the current fileObjs
                    let tempFileObjs = [...fileObjs]
                    for(var i=0; i< tempFileObjs.length; i++){
                        if( tempFileObjs[i].id === fileId && !tempFileObjs[i].permissionIds.includes('dropbox')){
                            tempFileObjs[i].permissionIds[0] = res   
                        }
                    }
        
                    setFileObjs(tempFileObjs)
                }else if(res.includes('onedrive')){
    
                    for(var i=0; i<persistentFilesObjs.length; i++){
                        if(persistentFilesObjs[i].id === fileId){
                            persistentFilesObjs[i].permissionIds[0] = res   
                        }
                    }
                    //update the current fileObjs
                    let tempFileObjs = [...fileObjs]
                    for(var i=0; i< tempFileObjs.length; i++){
                        if( tempFileObjs[i].id === fileId && !tempFileObjs[i].permissionIds.includes('dropbox')){
                            tempFileObjs[i].permissionIds[0] = res   
                        }
                    }
                    setFileObjs(tempFileObjs)
    
                }else{
                    toast.error("File share failed.")
                }
            }
        }   
    }

    async function onCopyShareLinkClick(fileId, driveType, permissionIds, fileEmail){
        let url = ''
        switch(driveType){
            case 'google-drive':
                navigator.clipboard.writeText('https://drive.google.com/open?id='+fileId)
                break
            case 'dropbox':
                url = permissionIds[0].replace('dropbox:','')
                navigator.clipboard.writeText(url)
                break
            case 'onedrive':
                if(permissionIds.includes('onedrive')){
                    url = permissionIds[0].replace('onedrive:','')
                }else{
                    const body = JSON.stringify({fileId: fileId, fileName: '', driveEmail: fileEmail, driveType: driveType, path: '', sharedLink: ''})
                    const res = await myFetch('shareFile', 'POST', body)
                    url = res.replace('onedrive:', '')
                }
                
                navigator.clipboard.writeText(url)
                break
        }
    }

    function onBurgerMenuClick() {
        if(sideMenuDisplay === 'inline-block'){
            setSideMenuDisplay('none')
        }else{
            setSideMenuDisplay('inline-block')
        }
    }

    if(redirect === 'logout'){
        return(      
            <Redirect to = "/"/>
        )
    }else if(redirect === 'unauthorized'){
        return(      
            <Redirect to = "unauthorized"/>
        )
    }else if(redirect === undefined){
        return null
    }

    return(

        <div className = "drive-page__body">
            {dragging ? <div className = "dropzone-effect"/> : null}
            <a ref={linkRef}/>
            <ToastContainer 
                position = "bottom-left"
                autoClose = {2500}
                
                hideProgressBar
                newestOnTop
                closeOnClick
            />
            <LoadingBar
                uploadPercentage = {uploadPercentage}
                isUploading = {isUploading}
            />
        
            <AddButtons
                uploadFileButtonRef = {uploadFileButtonRef}
                onOpenFileClick = {onOpenFileClick}
                onUploadClick = {onUploadClick}
            />
            
            <OpenFileModal 
                ref = {openFileModalRef}
                type = {openFileModalType}
                openFileLink = {openFileInfo}
            />

            <UploadModal
                ref = {uploadModalRef}
                type = {uploadType}
                objects = {virtualDriveEnabled === true ? sharedWithEmails.permissionIds : driveObjs}
                onSpecificRowClick = {virtualDriveEnabled === true ? unshareVirtualFolder : setDriveForUpload}
            />

            <Modal
                ref = {addDriveRef}
                modalType = {modalType}
                deleteMode = {deleteMode}
                fileNameForDelete = {fileForDelete.name}
                driveForDelete = {driveForDelete}
                exportFormats = {exportFileFormats}
                onExportFormatClick = {onExportFormatClick}
                onAddGoogleDriveClick = {()=>{onAddDriveClick('googledrive')}}
                onAddDropboxClick = {()=>{onAddDriveClick('dropbox')}}
                onAddOneDriveClick =  {()=>{onAddDriveClick('onedrive')}}
                onConfirmDeleteClick = {deleteMode === 'file' ? deleteFile : deleteDrive}
                onConfirmRenameClick = {renameFile}
                onConfirmVirtualShareClick = {shareVirtualFolder}
                renameValue = {renameInputText}
                onRenameChange = {(event)=>{onRenameChange(event)}}
            />   

            <TitleBanner
                onAddDriveClick = {showAddDriveModal}
                onSignOutClick = {signOut}
                onSwitchDriveModeClick = {switchDriveMode}
                email = {email}
                virtualDriveEnabled = {virtualDriveEnabled}
                virtualQuota = {virtualQuota}

                onBurgerMenuClick = {onBurgerMenuClick}
                virtualDriveEnabled = {virtualDriveEnabled}
            />

            <MenuBanner
                onCheckboxClick = {onConnectedDrivesCheckboxClick}
                onDivClick = {onConnectedDrivesCheckboxClick}
                onCloseSideMenuClick = {onBurgerMenuClick}
                sideMenuDisplay = {sideMenuDisplay}
                checkboxChecked = {checkboxChecked}
                backButtonEnabled = {backButtonEnabled}
                onBackButtonClick = {onBackButtonClick}
                isUploading = {isUploading}
                dragEnter = {dragging}
                isInRoot = {driveStack.head() !== 'root' || virtualDriveEnabled? false : true}
            />

            <div className = "sidebar-scroll">

                {driveStack.head() !== 'root' || virtualDriveEnabled ? null : (
                   
                    <div className = "drive-elements-container" style = {{display: sideMenuDisplay}}>
                        {
                            isLoading.drives ? (
                                <Loader
                                    loadingText = {true}
                                    size = {'25px'}
                                />   
                            ):
                            (
                                driveObjs.length === 0 ? (
                                    <>
                                        <p className = "no-drives-text">There are no connected drives...</p>
                                        <p onClick = {showAddDriveModal} className = "no-drives-text clickable-text">Add a drive</p>
                                    </>
                                ): 
                                (
                                    driveObjs.map((drive, index) => {
                                        return(
                                            <DriveElement
                                                key = {index}
                                                onClick = {()=>{selectDrive(index)}}
                                                onDeleteDriveClick = {(e)=>{onDeleteDriveClick(e, drive.email, drive.driveName)}}
                                                className = {drive.isActive ? 'isActive-div' : 'isInactive-div'}
                                                opacity = {drive.isActive ? '100%' : '50%'}
                                                email = {drive.email}
                                                driveName = {drive.driveName}
                                                quota = {drive.quota}
                                            />
                                        )
                                    })
                                )
                            )
                        }
                        
                    </div>
                )}
                <div 
                    className = "scrollview" 
                    onDrop={(e)=>{handleDrop(e)}}
                    onDragOver={e => handleDragOver(e)}
                    onDragEnter={e => handleDragEnter(e)}
                    onDragLeave={e => handleDragLeave(e)}
                >
                    {
                        isLoading.files ? (
                            <Loader
                                loadingText = {true}
                                size = {'25px'}
                            />                           
                        ):
                        (
                            fileObjs.length === 0 ? (
                                <p className = "no-files-text">
                                    There are no files to show...
                                </p>
                            ) :
                            (
                                fileObjs.map((file, index) => 
                                    <FileRow
                                        key = {index}
                                        userEmail = {email}
                                        fileType = {file.type}
                                        fileName = {file.name}
                                        fileExtension = {file.extension}
                                        fileDrive = {file.drive}
                                        fileEmail = {file.email}
                                        fileDate = {file.createdTime}
                                        filePermissions = {file.permissionIds}
                                        fileSize = {file.size}
                                        onFileClick = {()=>{onFileClick(file)}}
                                        onDownloadClick ={()=>{onDownloadFileClick(file.exportLinks, file.id, file.name, file.email, file.type, file.drive, file.extension)}}
                                        onRenameClick = {()=>{onRenameFileClick(file.name, file.id, file.email, file.drive, file.path)}}
                                        onDeleteClick = {()=>{onDeleteFileClick(file.name, file.id, file.email, file.drive, file.path)}}
                                        onShareClick = {(isShared)=>{onShareFileClick(file.id, file.name, file.email, file.drive, file.path, isShared, file.permissionIds[0], file.permissionIds)}}
                                        onCopyShareLinkClick = {()=>{onCopyShareLinkClick(file.id, file.drive, file.permissionIds, file.email)}}
                                        onAddSharedUser = {()=>{onShareFileClick(file.id, file.name, file.email, file.drive, file.path, false, file.permissionIds[0], file.permissionIds)}}
                                    />
                                )
                            )
                        )
                    }

                </div>
            </div>
        </div>       
    )
}
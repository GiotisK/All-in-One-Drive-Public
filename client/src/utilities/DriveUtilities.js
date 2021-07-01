


export const downloadDriveFile = async (fileMetadata) => {
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
                        handleBlob(res)
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
                        handleBlob(res)
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
                    handleBlob(res)
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



const handleBlob = async (res) => {
    if(res.status === 200){
        const blob = await res.blob()
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
}
export const mimeTypes = {
    /*txt formats*/
    json: "application/vnd.google-apps.script+json",
    pdf: "application/pdf",
    odt: "application/vnd.oasis.opendocument.text",
    html: "text/html",
    zip: "application/zip",
    txt: "text/plain",
    rtf: "application/rtf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",//needs fixing doesnt work
    epub: "application/epub%2Bzip",

    /*excel formats*/
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    ods: "application/x-vnd.oasis.opendocument.spreadsheet",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    /*powerpoint formats*/
    odp: "application/vnd.oasis.opendocument.presentation",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    /*image formats*/
    png: "image/png",
    PNG: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",

    /*dropbox folder hacky way to download as zip*/
    folder: "application/zip",

    /*html supported sound formats*/
    mp3: "audio/mp3",
    wav: "audio/wat",
    ogg: "audio/ogg",

    /*html supported video formats*/
    mov: "video/mp4",
    mp4: "video/mp4"

}

const _includes = (input, strings) => {
    for ( let string of strings ){
        if(input.includes(string)){
            return true
        }
    }
    return false
}

export const isImage = (extension) => {
    extension = extension.toLowerCase()
    if(_includes(extension, ['png', 'jpg', 'jpeg'])){
        return true
    }
    return false
}

export const isVideo = (extension) => {
    extension = extension.toLowerCase()
    if(_includes(extension, ['mp4', 'mov'])){
        return true
    }
    return false
}


export const isAudio = (extension) => {
    extension = extension.toLowerCase()
    if(_includes(extension, ['mp3', 'wav', 'ogg'])){
        return true
    }
    return false
}

export const isPdfOrTxt = (extension) => {
    extension = extension.toLowerCase()
    if(_includes(extension, ['txt', 'c', 'js', 'pdf'])){
        return true
    }
    return false
}

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0 || bytes === undefined) return '-';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
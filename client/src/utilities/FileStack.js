export default class FileStack {
    
    constructor(){
        this.files = [];
    }

    setFiles = (files) => {
        this.files = [files]
    }

    push = (newFiles) => { 
        this.files.unshift(newFiles)
    }

    pop = () => {  
        this.files.shift()
    }

    head = () => {
        return(this.files[0])
    }

    getFiles = () => {
        return this.files
    }

    setHead = (files) => {
        files.forEach(file => {
            this.files[0].unshift(file)
        });  
    }

    removeFile = (id) => {
        this.files[0] = this.files[0].filter((file) => {
            if(file.id !== id){
                return file
            }
        })
    }

    setLastElement = (files) => {
        this.files[this.files.length-1] = files
    }

    reset = () => {
        this.files = []
    }

}


var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

const saltRounds = 10;
const date = new Date()

/*the code below allows us to create User objects with unique email, password)*/
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    "google-drive":[{email:String, aiofolder_id: {type: String, default: ''}, token: String}],
    dropbox:[{email:String, aiofolder_id: {type: String, default: ''}, token: String}],
    onedrive:[{email:String, aiofolder_id: {type: String, default: ''}, token: String}],
    virtualdrive:{
        sharedFolders: [{
            virtualFolderId: {type: String},
            sharedWithEmail: {type: String},
            
        }],
        enabled: {type: Boolean, default: true}, 
        folders: {type: Array,
            default: [
                {
                    id:mongoose.Types.ObjectId(),
                    name: 'Shared with me',
                    parents: [''],
                    createdTime: date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate(),
                    permissionIds: [''],
                    type: 'folder',
                    email: '',
                    drive: 'aio-drive',
                    extension: 'folder',
                    path: '',
                    virtualParent: 'root'
                }
            ]
        },
        files: {type: Array, default: []}
    }
})


UserSchema.pre('save', function(next) {
    // Check if document is new or a new password has been set
    if (this.isNew || this.isModified('password')) {
      // Saving reference to this because of changing scopes
        const document = this;
        bcrypt.hash(document.password, saltRounds,
            function(err, hashedPassword) {
            if (err) {
                next(err);
            }else {
                document.password = hashedPassword;
                next();
            }
        });
    } else {
        next();
    }
});

UserSchema.methods.isCorrectPassword = function(password, callback){
    bcrypt.compare(password, this.password, function(err, same){
        if (err) {
            callback(err);
          } else {
            callback(err, same);
          }
    });
}

module.exports = mongoose.model('User', UserSchema)
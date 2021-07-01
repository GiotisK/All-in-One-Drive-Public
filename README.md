![logo aio](https://user-images.githubusercontent.com/10963096/124155177-dfd68d00-da9e-11eb-967b-514784f93abb.PNG)  
AiO Drive is a web application that unifies the most commercial cloud drive services (Google Drive, Dropbox, OneDrive)  

# Technologies used 
* MongoDB (Atlas) (mongoose ^5.9.2)
* Express ~4.16.1
* React 16.11.0
* Node 12.10.0
* Cloud APIs
* oAuth2

# Features  
* Connection of the most popular cloud drives (Google Drive, Dropbox, OneDrive)
* Listing of the files that are hosted in the drives mentioned  
* Download, Upload (single/bulk), Rename, Sharing, Deletion of the files 
* Unified Virtual Drive Interface, where users see all their connected drives as one and:
  * Automatic upload of the files in the cloud drive with the least free space
  * Creation of virtual folders that host files from the 3 cloud drives mentioned above  
# Experimental Features  
* **Rearrangment of files between the drives**.  In the worst case scenario when a file that is beeing uploaded, doesnt fit to any of the connected drives. In this case, the server tries to rearrange the files between the drives with the goal of creating the correct amount of empty space in one connected drive so the file can finally fit.  
# Setup  
*  Run ```npm install``` in each of the following folders: **api**, **client**
*  Create a project in each of the cloud platforms and obtain client ids and client secrets
*  After that create a .env file in the root of the api folder, with the following properties:  
  
```JWT_SECRET = your JWT secret```  
```MONGODB_CONNECTION_URI = your atlas connection string```    (example: ```mongodb+srv://username:password@cluster0-jtpxd.mongodb.next/admin ```)  
```json
GOOGLE_DRIVE_CREDENTIALS =
{
 "installed": 
  {
   "client_id":"your client id",
   "project_id":"the id of your project in the google cloud console",
   "auth_uri":"https://accounts.google.com/o/oauth2/auth",
   "token_uri":"https://oauth2.googleapis.com/token",
   "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
   "client_secret":"your client secret",
   "redirect_uris":["http://localhost:3000/drive","http://localhost"]
  }
}
```

```json
DROPBOX_CREDENTIALS = 
{
 "client_id":"your client id", 
 "client_secret":"your client secret", 
 "redirect_uri":"http://localhost:3000/drive?driveType=dropbox"
}
```

```json
ONEDRIVE_CREDENTIALS = 
{
 "client_id":"your client id", 
 "client_secret":"your client secret", 
 "redirect_uri":"http://localhost:3000/drive", 
 "scope":"files.readwrite+User.Read+offline_access"
}
```
```AES256_KEY = your-AES-key ```  
# Run  
*  ```npm start``` inside the **api** folder to run the server  
*  ```npm start``` inside the **client** to run the webpage folder  
*  navigate to ```http://localhost:3000```  
*  If you have set correctly the MongoDB Atlas clusters, you should be able to sign up and then log into the web application  

# Interface explanation  
After logging in, the web application consists of two sub-interfaces each of it has its own use and purpose. By clicking the top right circle button that opens the menu, you can switch modes.  
  
**All-in-One Interface**  
The purpose of this interface is to handle all the connected drives uniquely. For example, when you are in this interface, you can filter the connected drives, choose in which drive to upload the file etc.  
  
**Virtual Drive Interface**    
The purpose of this interface is to treat all the connected drives as one.   
_**And what does this mean?**_  
It means that you can upload a file without choosing the drive the file will be uploaded too. The server decides in which drive the file will conclude. Also, you can create virtual folders where you can upload files that can belong to different cloud drives  
# Screenshots  
  
* **Frontpage**  
  
![frontpage](https://user-images.githubusercontent.com/10963096/124174010-81b4a480-dab4-11eb-8261-1412a0a8f77a.PNG)

* **All-in-one interface**  
  
![interface1](https://user-images.githubusercontent.com/10963096/124173483-c25fee00-dab3-11eb-9144-da2e2a06c43f.PNG)  
  
* **Virtual Drive interface**  
  
![interface2](https://user-images.githubusercontent.com/10963096/124173896-5af66e00-dab4-11eb-8c98-8813e68ba3f1.PNG)  

# Concerns and direction of this project  
Currently this project has some security issues. Some of them include the storage of sensitive tokens online, which are encrypted with a simple AES256 key in the server and stored in the database. Obtaining access to the server, someone can expose all stored tokens in the database.  Im thinking that this web application has to be partly re-implemented with local MongoDB database. There is no plan of hosting this web application ever online.  

**Some thoughts for the re-implementation**  
* Revert MongoDB database from ATLAS cloud db, to local db.  
* Remove sharing of files between users, or keep functionality between local users.  

# Bugs
* There are sure some untracked bugs that I havent come across to yet. If you find one I will update this list or post an issue.  
* Deleting contents from a drive, switching to virtual drive and uploading a file in virtual drive, results to rerendering the file-rows of the deleted files  

# Future TODOs  
* Maybe add more cloud drive services. For example **pCloud**  
* Since dropbox will use refresh tokens starting in September, the refresh token logic must be implemented in the dropbox handler aswell.  
From dropbox: _On September 30th, 2021, the Dropbox OAuth flow will no longer return new long-lived access tokens. It will instead return short-lived access tokens, and optionally return refresh tokens. Existing tokens are not impacted._





  

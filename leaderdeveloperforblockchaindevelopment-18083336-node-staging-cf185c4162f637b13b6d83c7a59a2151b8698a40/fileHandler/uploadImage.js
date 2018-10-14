const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: "dzfkoehsr",
    api_key: "973829193295832",
    api_secret: "-iR0dSIAWvDUlhtwdaY-vh6SBKg"
    })
  function uploadImage(image_data, callback){
      console.log("in fun")
      cloudinary.uploader.upload(image_data, function(result){
       if(result){
         console.log("profile pic result-==========================>"+result.url)
         callback(null,result.url);
        }
      })
    }
  
    module.exports = {
      uploadImage
    };
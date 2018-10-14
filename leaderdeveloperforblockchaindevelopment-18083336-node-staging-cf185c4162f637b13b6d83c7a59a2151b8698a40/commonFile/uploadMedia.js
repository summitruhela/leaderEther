const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: "sumit9211",
    api_key: "885582783668825",
    api_secret: "0dT6FoxdcGb7UjTKtUGQbAVdOJI"
});

module.exports = {

    //function to upload image
    uploadImg: (base64, cb) => {
        // console.log("#######################",base64)
        cloudinary.v2.uploader.upload(base64, (err, result) => {
            if (err) cb(err)
            else cb(null,result.url);
        })
    },
    uploadMultipleImages: (imagesB64, callback) => {
        let a = [];
        console.log("uploadMultipleImages");
        async.eachSeries(imagesB64, (item, callbackNextIteratn) => {
           uploadImg(item, (err, url) => {
                if (err) throw err
                else {
                 a.push(url);
                     //console.log("#############",a);
                    // console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", url)
                    callbackNextIteratn();
                    // console.log("%%%%%%%%%%%",a);
                }
            })
        }, (err) => {
            console.log("aaaaaassasdsssssssssss",a)
            callback(null,a);       
            console.log("Done with async loop")
        })
        console.log("----------result of multi image uploader--------->>>", a);
    },


    // imageUploadToCloudinary: (imageB64, callback) => {
    //     // console.log(imageB64)
    //     cloudinary.v2.uploader.upload(imageB64, (err, result) => {
    //         console.log(err, result);
    //         callback(result.url);
    //     })
    // }
}
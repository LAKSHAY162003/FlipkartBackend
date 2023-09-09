const mongoose = require("mongoose")

const uploadedDocumentSchema = new mongoose.Schema({
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
});
const ApplicationSchema = new mongoose.Schema({
    userWalletAddress:String,
    firstName:String,
    userEmail:String,
    grantType:String,
    description:String,
    applicationDate: {
        type: Date, 
        default: Date.now,
    },
    uploadedDocument:uploadedDocumentSchema,
});


const Application = mongoose.model("application", ApplicationSchema);


module.exports=Application;


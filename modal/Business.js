const mongoose = require("mongoose")

// list of all the business and there associated with us !! 
// and unki details !!  
const businessSchema=new mongoose.Schema({
        businessWalletAddress:String,
        name:String,
        email:String,
        pwd:String,
        tokenContractAddress:String
});


const Business = mongoose.model("business", businessSchema);
module.exports=Business;
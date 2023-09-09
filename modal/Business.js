const mongoose = require("mongoose")

// list of all the business and there associated with us !! 
// and unki details !!  
const businessSchema=new mongoose.Schema({
        role:{type:String,default:"Business"},
        businessWalletAddress:String,
        name:String,
        email:String,
        pwd:String,
        tokenContractAddress:{type:String,default:"NA"},
        tokenSymbol:{type:String,default:"NA"}
});


const Business = mongoose.model("business", businessSchema);
module.exports=Business;
const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    userWalletAddress:String,
    firstName:String,
    lastName:String,
    userEmail:String,
    transactions:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    loyaltyPoints:[
       { business : { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
         totalCount:Number 
       }
    ],
    pwd:String
});





const User = mongoose.model("user", UserSchema);


module.exports=User;


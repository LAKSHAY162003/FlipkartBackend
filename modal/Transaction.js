const mongoose = require("mongoose")

// type=="Grant" or "Else"
// Grant ones are to be get using routes !! for auditing tool creation !!
const transactionSchema=new mongoose.Schema({
    type:{type:String,default:"Else"},
    txHash:String,
    applicationId: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Application' 
    }
});

const Transaction = mongoose.model("transaction", transactionSchema);

module.exports=Transaction;
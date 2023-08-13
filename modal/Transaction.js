const mongoose = require("mongoose")


const transactionSchema=new mongoose.Schema({
    txHash:String
});

const Transaction = mongoose.model("transaction", transactionSchema);

module.exports=Transaction;

require('dotenv').config();
const mongoose=require("mongoose");
const express = require('express');
const { ethers } = require("ethers");
const cors = require("cors")


const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  cors({
    origin: "*",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  })
)


const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")


const User=require("./modal/User");
const Business=require("./modal/Business");
const Transaction=require("./modal/Transaction");

const customerAuth=(req,res,next)=>{
  try{
    const accessToken=req.headers["authorization"];
    const valToBeVerified=accessToken.split(" ")[1];

    jwt.verify(valToBeVerified,process.env.SECRET_KEY,(err,user)=>{
        if(err){
            res.status(500).json({message:err.message});
        }else{
            if(user.role=="Customer"){
                req.user=user;
                next();
            }
            else{
                res.status(500).json({message:"UnAuthorized Access !!"});
            }
        }
    });
}
catch(err){
    res.status(500).json({message:err.message});
}
}

const businessAuth=(req,res,next)=>{
  try{
    const accessToken=req.headers["authorization"];
    const valToBeVerified=accessToken.split(" ")[1];

    jwt.verify(valToBeVerified,process.env.SECRET_KEY,(err,user)=>{
        if(err){
            res.status(500).json({message:err.message});
        }else{
            if(user.role=="Business"){
                req.user=user;
                next();
            }
            else{
                res.status(500).json({message:"UnAuthorized Access !!"});
            }
        }
    });
}
catch(err){
    res.status(500).json({message:err.message});
}
}


app.post('/registerBusiness',async (req, res) => {
  
  try {
    const { signedTransaction } = req.body;
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
    const transaction = await provider.getTransaction(signedTransaction);
    if (transaction) {
        console.log('Transaction details:', transaction);
    } else {
        res.json({message:'Transaction not found.'});
    }
    
    // here add in the transactions table !!
    const newTransaction = new Transaction({
      txHash: signedTransaction,
    });
    
    await newTransaction.save()
      .then(savedTransaction => {
        console.log('Transaction saved:', savedTransaction);
      })
      .catch(error => {
        console.error('Error saving transaction:', error);
      });
    
      // here add in the business table !!
    
    
    

      let saltRounds=10;
      bcrypt.hash(req.body.pwd, saltRounds, async function (err, hash) {
        if (err) {
          return res.status(500).json({ message: err.message })
        } else {
          // addBusiness in the business Table !!
          const newBusiness = new Business({
            businessWalletAddress:req.body.businessWalletAddress,
            name:req.body.name,
            email:req.body.email,
            pwd:hash,
            tokenContractAddress:req.body.tokenContractAddress
          });

          await newBusiness.save()
          .then(savedBusiness => {
            console.log('Business saved:', savedBusiness);

            const user = {
              _id: savedBusiness._id,
              role: "Business"
            }
            const accessToken = jwt.sign(user, process.env.SECRET_KEY)
            return res.status(200).json({ ...user, accessToken });

          })
          .catch(error => {
            console.error('Error saving Business:', error);
          });

        }
      })

  } catch (error) {
    console.error('Error registering business:', error);
    res.status(500).json({ error: 'An error occurred My Friend' });
  }

});

// or we can say join Loyalty Points Program of that Buisness !!
// we will be sending the business's ids and There Names on frontend to 
// load it as a dropdown !! this will ensure that business wallet address
// will not be getting expossed !! 
app.post('/joinBusiness',customerAuth,async (req, res) => {
  try {
    const { signedTransaction, businessId } = req.body;
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
       return res.status(404).json({ error: 'User not found' });
    } 
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
    const transaction = await provider.getTransaction(signedTransaction);
    if (transaction) {
        console.log('Transaction details:', transaction);
    } else {
        res.json({message:'Transaction not found.'});
    }

    // here add in the transactions table !! and 
    // User me jaake : uske : Loyalty Points me 
    // is Buisness ko daal do !! and totalCount ko 0 set kardo !! 
 
     // Find the business by its ID
     const business = await Business.findById(businessId);
 
     if (!business) {
       return res.status(404).json({ error: 'Business not found' });
     }
 
     // Update the user's loyalty points with business details
     user.loyaltyPoints.push({
       business: businessId,
       totalCount: 0,
     });
 
     await user.save();
 
     // Save the transaction details in your transactions table
     const newTransaction = new Transaction({
       txHash: tx.hash,
     });
 
     await newTransaction.save();
     
    res.json({ message: 'Joined business successfully!' });

  } catch (error) {
    console.error('Error joining business:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



// see basically here : we will be using jwt to register the customer !! 
// vvimp !! 
app.post('/registerCustomer', async (req, res) => {
  try {
    const { signedTransaction } = req.body;
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
    const transaction = await provider.getTransaction(signedTransaction);
    if (transaction) {
        console.log('Transaction details:', transaction);
    } else {
        res.json({message:'Transaction not found.'});
    }
    // here add in the transactions table and User Table !!

    const newTransaction = new Transaction({
      txHash: signedTransaction,
    });
    
    await newTransaction.save()
      .then(async(savedTransaction) => {
        console.log('Transaction saved:', savedTransaction);

        let saltRounds=10;
      bcrypt.hash(req.body.pwd, saltRounds, async function (err, hash) {
        if (err) {
          return res.status(500).json({ message: err.message })
        } else {
          // addUser in the customer Table !!
          const newUser = new User({
            userWalletAddress:req.body.userWalletAddress,
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            userEmail:req.body.userEmail,
            transactions:[savedTransaction._id],
            loyaltyPoints:[],
            pwd:hash
          });

          // Save the user
          await newUser.save().then(savedUser => {
            console.log('User and transaction saved:', savedUser);
            const user = {
              _id: savedUser._id,
              role: "Customer"
            }
            const accessToken = jwt.sign(user, process.env.SECRET_KEY)
            return res.status(200).json({ ...user, accessToken });

          }).catch(error => {
            console.error('Error saving user:', error);
          });
    
          
        }
      })

      })
      .catch(error => {
        console.error('Error saving transaction:', error);
      });

  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



// here we will get buisnessId as a parameter and wallet address of User 
// as a parameter !!
// how many rewards to be increased that is dikkat na !! 

// see : how is it fraud proof ? 
// bcz : that signed transaction : that will not be available to the hacker !!
// how will he get that ? bcz : we will not be exposing the business private id and all 
// anywhere !! so done !!
app.post("/getReward",customerAuth,async(req,res)=>{
  try {
    const { signedTransaction, businessId , amount } = req.body;
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
       return res.status(404).json({ error: 'User not found' });
    }     
    const transaction = await provider.getTransaction(signedTransaction);
    if (transaction) {
        console.log('Transaction details:', transaction);
    } else {
        res.json({message:'Transaction not found.'});
    }

    // Save the transaction details in your transactions table
    const newTransaction = new Transaction({
      txHash: tx.hash,
    });

    await newTransaction.save();

    // here add in the transactions table !! and 
    // User me jaake : uske : Loyalty Points me 
    // is Buisness ko daal do !! and totalCount ko 0 set kardo !! 
 
     // Find the business by its ID
     const business = await Business.findById(businessId);
 
     if (!business) {
       return res.status(404).json({ error: 'Business not found' });
     }
 
     // Update the user's loyalty points with business details
        const loyaltyPointsIndex = user.loyaltyPoints.findIndex(
          (loyaltyPoint) => loyaltyPoint.business.toString() === businessId
        );
        
        if (loyaltyPointsIndex !== -1) {
          // If the business is already associated with the user, increment the totalCount
          user.loyaltyPoints[loyaltyPointsIndex].totalCount += amount;
        } else {
          // If the business is not associated with the user, add a new entry
          // Enroll 1st !! 
          res.json({message:"First Enroll Into the program !!"});
        }

        await user.save();
     
      res.json({ message: 'Joined business successfully!' });

  } catch (error) {
    console.error('Error joining business:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


// this will be returing jwt to the user !! 
app.post("/loginCustomer",async (req,res)=>{
  const { userWalletAddress , pwd } = req.body; // imp !! userWalletAddress , pwd to be used !! 
  try {
    const results = await User.find({userWalletAddress:userWalletAddress})

    if (results.length === 0) {
      return res.status(500).json({ message: "NO ENTRY FOUND !!!" })
    }

    let userFound = false;

    for (const result of results) {
      const storedHashedPassword = result.pwd;
      const passwordMatch = bcrypt.compare(pwd, storedHashedPassword);

      if (passwordMatch) {
        const user = {
          _id: result._id,
          role: "Customer"
        }
        const accessToken = jwt.sign(user, process.env.SECRET_KEY)
        return res.status(200).json({ accessToken, ...user })
      }
    }

    res.status(500).json({ message: "INVALID CREDENTIALS !!!" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
});


// Rectify them !!
app.get('/get-transaction-recipt/customer/:transactionHash'
,customerAuth, async (req, res) => {
    try {

      const { transactionHash } = req.params;
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
      const receipt = await provider.getTransactionReceipt(transactionHash);
      res.json(receipt);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
});


app.get('/get-transaction-recipt/business/:transactionHash'
,businessAuth, async (req, res) => {
    try {

      const { transactionHash } = req.params;
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
      const receipt = await provider.getTransactionReceipt(transactionHash);
      res.json(receipt);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
});



app.get('/getListOfBusiness',async(req,res)=>{

  try{
    const businesses = await Business.find().select('_id businessWalletAddress name tokenContractAddress');
    res.json(businesses);
  }
  catch(error){
    console.log(error);
    res.json({message:error.message});
  }


});

// get the transaction hashes !! for a customer !!
app.get('/getTransactionHistroy',customerAuth,async(req,res)=>{
  
  try{
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } 
    else{
      
      const transactionIds=user.transactions;
      // Find transactions by their IDs
      const transactions = await Transaction.find({ _id: { $in: transactionIds } });
        
      if (!transactions || transactions.length === 0) {
          return res.status(404).json({ error: 'No transactions found' });
      }
      
      res.json(transactions);

    }
  }
  catch(error){
    console.log(error);
    res.json({message:error.message});
  }

});
  
  
app.set("port", process.env.port || 3000)
app.listen(app.get("port"), async() => {
  try{
    
  console.log(`Server Started on http://localhost:${app.get("port")}`)
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDbConnected`);
  
  }
  catch(error){
    console.log("Unsucess");
  }
});
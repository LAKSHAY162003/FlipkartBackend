
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
const Application = require('./modal/Applications');

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

const adminAuth=(req,res,next)=>{
  try{
    const accessToken=req.headers["authorization"];
    const valToBeVerified=accessToken.split(" ")[1];

    jwt.verify(valToBeVerified,process.env.SECRET_KEY,(err,user)=>{
        if(err){
            res.status(500).json({message:err.message});
        }else{
            if(user.role=="Admin"){
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

app.post('/registerAdmin',async (req, res) => {
  
  try {

      let saltRounds=10;
      bcrypt.hash(req.body.pwd, saltRounds, async function (err, hash) {
        if (err) {
          res.status(500).json({ message: err.message })
        } else {
          // addBusiness in the business Table !!
          const newBusiness = new Business({
            businessWalletAddress:req.body.businessWalletAddress,
            name:req.body.name,
            email:req.body.email,
            pwd:hash
          });

          await newBusiness.save()
          .then(savedBusiness => {
            console.log('Business saved:', savedBusiness);

            const user = {
              _id: savedBusiness._id,
              role: "Admin"
            }
            const accessToken = jwt.sign(user, process.env.SECRET_KEY)
            res.status(200).json({ ...user, accessToken });

          })
          .catch(error => {
            console.error('Error saving Admin:', error);
          });

        }
      })

  } catch (error) {
    console.error('Error registering Admin:', error);
    res.status(500).json({ error: 'An error occurred My Friend' });
  }

});


app.post('/registerBusiness',async (req, res) => {
  
  try {
    const { signedTransaction } = req.body;
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    
    provider.getTransactionReceipt(signedTransaction).then(receipt => {
          if (receipt.status === 1) {
              console.log('Transaction was successful.');
          } else {
              res.status(500).json({message:'Transaction failed.'});
          }
      }).catch(error => {
          console.log(error);
      });
    
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
          res.status(500).json({ message: err.message })
        } else {
          // addBusiness in the business Table !!
          const newBusiness = new Business({
            businessWalletAddress:req.body.businessWalletAddress,
            name:req.body.name,
            email:req.body.email,
            pwd:hash,
            tokenContractAddress:req.body.tokenContractAddress,
            tokenSymbol:req.body.tokenSymbol
          });

          await newBusiness.save()
          .then(savedBusiness => {
            console.log('Business saved:', savedBusiness);

            const user = {
              _id: savedBusiness._id,
              role: "Business"
            }
            const accessToken = jwt.sign(user, process.env.SECRET_KEY)
            res.status(200).json({ ...user, accessToken });

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
      res.status(404).json({ error: 'User not found' });
    } 
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    
    provider.getTransactionReceipt(signedTransaction).then(async(receipt) => {
      if (receipt.status === 1) {
          console.log('Transaction was successful.');



      } else {
          console.log({message:'Transaction failed.'});
      }
  }).catch(error => {
      console.log({'Error:':error});
  });


    
     // Save the transaction details in your transactions table
     const newTransaction = new Transaction({
      txHash:signedTransaction,
    });
    
      const savedDocument=await newTransaction.save();
      let savedId=savedDocument._id;
   

    // here add in the transactions table !! and 
    // User me jaake : uske : Loyalty Points me 
    // is Buisness ko daal do !! and totalCount ko 0 set kardo !! 
 
     // Find the business by its ID
     const business = await Business.findById(businessId);
 
     if (!business) {
        console.log({ error: 'Business not found' });
     }
 
     // Update the user's loyalty points with business details
     user.loyaltyPoints.push({
       business: businessId,
       totalCount: 0,
     });

     user.transactions.push(savedId);
     await user.save();
      res.json({ message: "Done Success"});

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
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    
    provider.getTransactionReceipt(signedTransaction).then(receipt => {
      if (receipt.status === 1) {
          console.log('Transaction was successful.');
      } else {
          console.log('Transaction failed.');
      }
  }).catch(error => {
      console.log(error);
  });
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
          console.log(err);
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
            res.status(200).json({ ...user, accessToken });

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


// Routes regarding applications handling : 
app.post("/submitApplication",customerAuth,upload.single('file'),async(req,res)=>{
    // see we will pass the transaction Hashes !! 
    // so simply : just confirm those hashes and then : just : save the application 
    // into our db !! 
    //type means type of grant !! 
    const { signedTransaction,type,userWalletAddress
      ,firstName,userEmail,grantType
    ,description,applicationDate} = req.body;

    const { filename, originalname, mimetype, size, path } =req.file;
    const uploadedDocument={
      filename:filename, originalname:originalname, mimetype:mimetype, size:size, path:path
    };
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }

    provider.getTransactionReceipt(signedTransaction).then(receipt => {
      if (receipt.status === 1) {
          console.log('Transaction was successful.');
      } else {
          res.status(500).json({message:'Transaction failed.'});
      }
  }).catch(error => {
      console.log({'Error:':error});
  });

      // Save the transaction details in your transactions table
    const newTransaction = new Transaction({
      type:type,
      txHash: signedTransaction,
    });

    const savedDocument=await newTransaction.save();
   
   let savedId=savedDocument._id; 
   // Transactions saved into db !! 

   // now : add the application into the db !! 
    
   const newApplication = new Application({
    userWalletAddress:userWalletAddress,
    firstName:firstName,
    userEmail:userEmail,
    grantType:grantType,
    description:description,
    applicationDate: applicationDate,
    uploadedDocument:uploadedDocument,
  });
    await newApplication.save();

    res.json("Successfull Upload !!");
});

app.get("/getAllApplications",adminAuth,async(req,res)=>{
  try{
    const applications = await Application.find();
    res.json(applications);
  }
  catch(error){
    console.log(error);
    res.json({message:error.message});
  }
});

app.post("/deleteApplication",adminAuth,async(req,res)=>{
    try{
      
      // we need to pass the application id only 
      const entryIdToDelete=req.body.id;
      //now just delete the id !!
      Application.findByIdAndRemove(entryIdToDelete, (err, deletedEntry) => {
        if (err) {
          res.json({message:err});
          // Handle the error, e.g., return an error response
        } else {
          if (deletedEntry) {
            res.json({message:'Entry deleted successfully:'});
            // Handle the success, e.g., return a success response
          } else {
            res.json({message:'Entry not found.'});
            // Handle the case where the entry with the given ID doesn't exist
          }
        }
      });
      

    }
    catch(error){
      console.log(error);
      res.json({message:error});
    }


});


// here we will get buisnessId as a parameter and wallet address of User 
// as a parameter !!
// how many rewards to be increased that is dikkat na !! 

// see : how is it fraud proof ? 
// bcz : that signed transaction : that will not be available to the hacker !!
// how will he get that ? bcz : we will not be exposing the business private id and all 
// anywhere !! so done !!
app.post("/dispatchReward",adminAuth,async(req,res)=>{
  try {
    const { signedTransaction, businessId , amount ,userId} = req.body;
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    const adminId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }     
    provider.getTransactionReceipt(signedTransaction).then(async(receipt) => {
      if (receipt.status === 1) {
          console.log('Transaction was successful.');
        // add to user table !! 
      } else {
          res.status(500).json({message:'Transaction failed.'});
      }
  }).catch(error => {
      console.log({'Error:':error});
      res.json("Error Saving");
  });

    // Save the transaction details in your transactions table
    const newTransaction = new Transaction({
      type:grant,
      txHash: signedTransaction,
    });

    const savedDocument=await newTransaction.save();
   
   let savedId=savedDocument._id;

    // here add in the transactions table !! and 
    // User me jaake : uske : Loyalty Points me 
    // is Buisness ko daal do !! and totalCount ko 0 set kardo !! 
 
     // Find the business by its ID
     const business = await Business.findById(businessId);
 
     if (!business) {
       console.log({ error: 'Business not found' });
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
        
        user.transactions.push(savedId);
        await user.save();
     
      res.json({ message: 'Joined business successfully!' });

  } catch (error) {
    console.error('Error joining business:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}); 
// see for business also we can maintain the balance but do we need to ? no !! 
// so simple : on frontend that function is already being created !! 


// so on spend we need to decrease !!
app.post("/spend",customerAuth,async(req,res)=>{
  try {
    const { signedTransaction, businessId , amount } = req.body;
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }     
    provider.getTransactionReceipt(signedTransaction).then(receipt => {
      if (receipt.status === 1) {
          console.log('Transaction was successful.');
      } else {
          res.status(500).json({message:'Transaction failed.'});
      }
  }).catch(error => {
      console.log({'Error:':error});
  });

    // Save the transaction details in your transactions table
    const newTransaction = new Transaction({
      txHash: signedTransaction,
    });

    
    const savedDocument=await newTransaction.save();
   
   let savedId=savedDocument._id;

    // here add in the transactions table !! and 
    // User me jaake : uske : Loyalty Points me 
    // is Buisness ko daal do !! and totalCount ko 0 set kardo !! 
 
     // Find the business by its ID
     const business = await Business.findById(businessId);
 
     if (!business) {
       console.log({ error: 'Business not found' });
     }
 
     // Update the user's loyalty points with business details
        const loyaltyPointsIndex = user.loyaltyPoints.findIndex(
          (loyaltyPoint) => loyaltyPoint.business.toString() === businessId
        );
        
        if (loyaltyPointsIndex !== -1) {
          // If the business is already associated with the user, increment the totalCount
          user.loyaltyPoints[loyaltyPointsIndex].totalCount -= amount;
        } else {
          // If the business is not associated with the user, add a new entry
          // Enroll 1st !! 
          res.json({message:"First Enroll Into the program !!"});
        }
        
        user.transactions.push(savedId);
        await user.save();
     
      res.json({ message: 'Deducted Amount successfully!' });

  } catch (error) {
    console.error('Error joining business:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}); 


app.post('/api/data/:id',customerAuth,async (req, res) => {
  try {
    const id = req.user._id;
    console.log(id);
    const document = await User.findById(id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log(document);
    const timestamp = document.timestamp.getTime();
    const value = document.valueField;

    res.json({ timestamp, value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



// this will be returing jwt to the user !! 
app.post("/loginCustomer",async (req,res)=>{
  const { userWalletAddress , pwd } = req.body; // imp !! userWalletAddress , pwd to be used !! 
  try {
    const results = await User.find({userWalletAddress:userWalletAddress})

    if (results.length === 0) {
       console.log({ message: "NO ENTRY FOUND !!!" })
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
        console.log("Entry Found");
        res.status(200).json({ accessToken, ...user })
      }
    }

    res.status(500).json({ message: "INVALID CREDENTIALS !!!" })
  } catch (err) {
    console.log(err);
  }
});

// this will be returing jwt to the user !! 
app.post("/loginBusiness",async (req,res)=>{
  const { businessWalletAddress , pwd } = req.body; // imp !! userWalletAddress , pwd to be used !! 
  try {
    const results = await Business.find({businessWalletAddress:businessWalletAddress})

    if (results.length === 0) {
       console.log({ message: "NO ENTRY FOUND !!!" })
    }


    for (const result of results) {
      const storedHashedPassword = result.pwd;
      const passwordMatch = bcrypt.compare(pwd, storedHashedPassword);

      if (passwordMatch && result.role==="Business") {
        const user = {
          _id: result._id,
          role: "Business"
        }
        const accessToken = jwt.sign(user, process.env.SECRET_KEY)
        console.log("Entry Found");
        res.status(200).json({ accessToken, ...user })
      }
    }

    res.status(500).json({ message: "INVALID CREDENTIALS !!!" })
  } catch (err) {
    console.log(err);
  }
});


// this will be returing jwt to the user !! 
app.post("/loginAdmin",async (req,res)=>{
  const { businessWalletAddress , pwd } = req.body; // imp !! userWalletAddress , pwd to be used !! 
  try {
    const results = await Business.find({businessWalletAddress:businessWalletAddress})

    if (results.length === 0) {
       console.log({ message: "NO ENTRY FOUND !!!" })
    }


    for (const result of results) {
      const storedHashedPassword = result.pwd;
      const passwordMatch = bcrypt.compare(pwd, storedHashedPassword);

      if (passwordMatch && result.role==="Admin") {
        const user = {
          _id: result._id,
          role: "Admin"
        }
        const accessToken = jwt.sign(user, process.env.SECRET_KEY)
        console.log("Entry Found");
        res.status(200).json({ accessToken, ...user })
      }
    }

    res.status(500).json({ message: "INVALID CREDENTIALS !!!" })
  } catch (err) {
    console.log(err);
  }
});


app.post("/getUserDetails",customerAuth,async(req,res)=>{

  try{
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    }   
    console.log(user);
    res.status(200).json(user);
  }
  catch(error){
    console.log(error);
    res.status(400).json({error:"In Catch error"});
  }



});


app.post("/getBusinessDetails",businessAuth,async(req,res)=>{
  try{
    const businessId=req.user._id;
    const business = await Business.findById(businessId);
    if (!business) {
      res.status(404).json({ error: 'User not found' });
    }   
    res.json(business);
  }
  catch(error){
    console.log(error);
    res.status(400).json({error:"In Catch error"});
  }
});

app.post("/getBusinessDetails/byUser",customerAuth,async(req,res)=>{
  
try{
  console.log("Hello");
  const businesses=req.body.businessess;
  console.log(businesses);
  let arr=[];

  for(let i=0;i<businesses.length;i++){
    let id=businesses[i].business;
    const business = await Business.findById(id);
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
      }   
      const newObject={
        businessDetails:business,
        totalCount:businesses[i].totalCount
      }
      arr.push(newObject);
  }

  res.status(200).send(arr);
  
}
catch(error){
  console.log(error);
  res.status(400).json({error:"In Catch error"});
}
});


// Rectify them !!
app.get('/get-transaction-recipt/customer/:transactionHash'
,customerAuth, async (req, res) => {
    try {

      const { transactionHash } = req.params;
      const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    
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
      const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
    
      const receipt = await provider.getTransactionReceipt(transactionHash);
      res.json(receipt);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
});



app.get('/getListOfBusiness',async(req,res)=>{

  try{
    const businesses = await Business.find().select('_id tokenSymbol businessWalletAddress name tokenContractAddress');
    res.json(businesses);
  }
  catch(error){
    console.log(error);
    res.json({message:error.message});
  }


});

// get the transaction hashes !! for a customer !!
app.post('/getTransactionHistroy',customerAuth,async(req,res)=>{
  
  try{
    const userId=req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
    } 
    else{
      
      const transactionIds = user.transactions;

      // Find transactions by their IDs
      const transactions = await Transaction.find({ _id: { $in: transactionIds } });
      
      if (!transactions || transactions.length === 0) {
          return res.status(404).json({ error: 'No transactions found' });
      }
      
      const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
      const responseArray = [];
      
      console.log(transactions);
      // Loop through each transaction and fetch its receipt
      for(let i=0;i<transactions.length;i++) {
          const receipt = await provider.getTransactionReceipt(transactions[i].txHash);
          responseArray.push(receipt);
      }

      console.log(responseArray);
      
      // Send the response array containing transaction receipt objects
      res.send(responseArray);      

    }
  }
  catch(error){
    console.log(error);
    res.json({message:error.message});
  }

});

// see we want not only the transaction recipts but also the name/details of the user to which 
// that grant is associated !! 
app.get("/getTransactionsForAudit",adminAuth,async(req,res)=>{

  try{

    const transactions=Transaction.find();
    const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API_KEY);
      const responseArray = [];
      
      console.log(transactions);
      // Loop through each transaction and fetch its receipt
      for(let i=0;i<transactions.length;i++) {
          const receipt = await provider.getTransactionReceipt(transactions[i].txHash);
          const newObj={
            receipt:receipt,
            Application:foundApplication
          }
          responseArray.push(receipt);
      }

      console.log(responseArray);
      
      // Send the response array containing transaction receipt objects
      res.send(responseArray); 

  }
  catch(error){
    console.log(error);
    res.json({message:error.message});
  }


})
  
  
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
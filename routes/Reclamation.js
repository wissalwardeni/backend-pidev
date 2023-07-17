const express = require("express");
const router = express.Router();
const reclamation = require("../models/reclamation") ;
const Type = require("../models/type")
const axios = require('axios');

const { MongoClient ,ObjectId  } = require('mongodb');




////get reclamation by id 

router.get("/reclamation/:id", async (req, res) => {
  try {
    const reclamationId = req.params.id;
    const Reclamation = await reclamation.findById(reclamationId);

    if (!Reclamation) {
      return res.status(404).json({ message: "Reclamation not found." });
    }

    res.send(Reclamation);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

   /*********************************************Get all recalamtions */

   router.get("/allreclamation",async(req,res)=>{
    try{
        const ajouter= await reclamation.find();
        res.send(ajouter);
    }catch(err){res.json({message:err})}
    })
   ///////////********************* */
   router.get("/traitée", async (req, res) => {
    try {
      const reclamationList = await reclamation.find({ status: "traitée" });
      res.send(reclamationList);
    } catch (err) {
      res.json({ message: err });
    }
  });


  /****************en cours */
  router.get("/encours", async (req, res) => {
    try {
      const reclamationList = await reclamation.find({ status: "En cours" });
      res.send(reclamationList);
    } catch (err) {
      res.json({ message: err });
    }
  });
  
/**************************End of the FUN */
    

      /********************************************Move and deleted */
      router.delete('/moveData/:id', async (req, res) => {
        const sourceCollectionName = 'reclamations';
        const targetCollectionName = 'Delete';
      
        const documentId = req.params.id;
      
        // Connect to MongoDB
        const client = new MongoClient('mongodb://127.0.0.1:27017', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
      
        try {
          // Connect to the MongoDB server
          await client.connect();
      
          // Get the database object
          const db = client.db('reclamation');
      
          // Get the source and target collections
          const sourceCollection = db.collection(sourceCollectionName);
          const targetCollection = db.collection(targetCollectionName);
      
          // Find the document in the source collection by ID
          const document = await sourceCollection.findOne({ _id: new ObjectId(documentId) });
      
          if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
          }
      
          // Move the document to the target collection
          await targetCollection.insertOne(document);
      
          // Remove the document from the source collection
          await sourceCollection.deleteOne({ _id: new ObjectId(documentId) });
      
          res.json({ message: 'Document moved successfully.' });
        } catch (error) {
          console.error('Error moving document:', error);
          res.status(500).json({ error: 'An error occurred while moving the document.' });
        } finally {
          // Close the MongoDB connection
          await client.close();
        }
      });
      
/***************************************End of the FUN */
router.get('/deletedDocuments', async (req, res) => {
  const targetCollectionName = 'Delete';

  // Connect to MongoDB
  const client = new MongoClient('mongodb://127.0.0.1:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Get the database object
    const db = client.db('reclamation');

    // Get the target collection
    const targetCollection = db.collection(targetCollectionName);

    // Retrieve all documents from the target collection
    const documents = await targetCollection.find().toArray();

    res.json(documents);
  } catch (error) {
    console.error('Error retrieving documents:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the documents.' });
  } finally {
    // Close the MongoDB connection
    await client.close();
  }
});



///////////*************************Send recalamation ********************///////////
router.post("/reclamer", async (req, res) => {
  const { type, titre, Description, fileData } = req.body;

  try {
    // Perform the join with the "Types" collection
    const joinedType = await Type.findOne({ type: type });

    if (!joinedType) {
      return res.status(404).json({ message: "Type not found." });
    }

    const reclamations = new reclamation({
      type: joinedType.type,
      titre,
      Description,
      fileData,
      
    });

    const savedReclamation = await reclamations.save();
    res.status(201).json(savedReclamation);
  } catch (error) {
    console.error("Error creating reclamation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

///////////*************************End send recalamation ********************///////////


//////////////////////********update***********////////////////
router.patch("/update/:id", async (req, res) => {
  try {
    const { titre, Description, fileData } = req.body;

    const updatedOperateur = await reclamation.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          titre,
          Description,
          fileData,
        },
      },
      { new: true }
    );

    res.send(updatedOperateur);
    console.log(updatedOperateur);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/////////update status 

router.patch("/updatee/:id", async (req, res) => {
  try {
    const status  = "traitée";
    console.log(status);

    const updatedReclamation = await reclamation.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { status } },
      { new: true }
    );

// Send the email with the new status
const sendEmail = async (to, subject, message) => {
  const { google } = require('googleapis');
  //setup oauth credentiels
  const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID,process.env.CLIENT_SECRET,process.env.REDIRECT_URI);
  oauth2Client.setCredentials({access_token :'ya29.a0AbVbY6OVSGG4v4XwmnIVVbk1Y-fYJyeoogQZS-RtPxG7uxsH9ATJs37XKygijhjjlR7Q5kAY2pRb2NlPK2ka6GWaNMsqpEkcx1WKKdlc0A4qFtnrq0hIA5tBJJFi6u5G7YagXWRoZ9Mhj8HhdcJ74hkXcSkIaCgYKAegSARESFQFWKvPl4KUj-JtKRk7kOGZYwxTrZQ0163' });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const emailLines = [];

  emailLines.push('From:wissal.wardani@esprit.tn');
  emailLines.push(`To: ${to}`);
  emailLines.push('Content-type: text/html;charset=iso-8859-1');
  emailLines.push('MIME-Version: 1.0');
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('');
  emailLines.push(message);

  const email = emailLines.join('\r\n').trim();

  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });
};

const emailBody = `The status of your reclamation has been updated to ${status}.`;
await sendEmail('<recipient_email@example.com>', 'Reclamation Status Update', emailBody);

    // Send the OneSignal notification
    const sendNotification = async (userId, message) => {
      const oneSignalConfig = {
        appId: '259df614-0853-4f53-b095-a25090a0a163',
        restApiKey: 'ODE5NjQ0ZjgtNGFhMS00ZGE4LWJlNjgtYmU3OTYyMzM4YTFm',
      };

      const notificationData = {
        app_id: oneSignalConfig.appId,
        include_player_ids: [userId],
        contents: { en: message },
      };

      try {
        await axios.post('https://onesignal.com/api/v1/notifications', notificationData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${oneSignalConfig.restApiKey}`,
          },
        });
      } catch (err) {
        console.error('Error sending OneSignal notification:', err);
      }
    };

    const userId = '<user_id>'; //user ID of the recipient
    const notificationMessage = 'Your reclamation status has been updated!';
    await sendNotification(userId, notificationMessage);

    res.send(updatedReclamation);
    console.log(updatedReclamation);


    res.send(updatedReclamation);
    console.log(updatedReclamation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



/////////////End update///////////////////////////







    
    

 
module.exports=router;
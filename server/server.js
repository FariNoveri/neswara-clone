   const express = require('express');
   const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
   const cors = require('cors');

   const app = express();
   app.use(express.json());
   app.use(cors());

   const client = new RecaptchaEnterpriseServiceClient();

   async function createAssessment({ projectID, recaptchaKey, token, recaptchaAction }) {
     const projectPath = client.projectPath(projectID);

     const request = {
       assessment: {
         event: {
           token,
           siteKey: recaptchaKey,
         },
       },
       parent: projectPath,
     };

     try {
       const [response] = await client.createAssessment(request);

       if (!response.tokenProperties.valid) {
         console.log(`Token invalid: ${response.tokenProperties.invalidReason}`);
         return { success: false, message: response.tokenProperties.invalidReason };
       }

       if (response.tokenProperties.action === recaptchaAction) {
         const score = response.riskAnalysis.score;
         console.log(`reCAPTCHA score: ${score}`);
         return { success: true, score, reasons: response.riskAnalysis.reasons };
       } else {
         console.log("Action mismatch");
         return { success: false, message: "Action mismatch" };
       }
     } catch (error) {
       console.error('Error in createAssessment:', error);
       return { success: false, message: 'Server error' };
     }
   }

   app.post('/api/verify-recaptcha', async (req, res) => {
     const { token, action } = req.body;
     const projectID = "neswaraclone";
     const recaptchaKey = "6Lf_FGorAAAAALQ28vlZNKWsiKV_O4lq3-2DZin9";

     const result = await createAssessment({ projectID, recaptchaKey, token, recaptchaAction: action });
     res.json(result);
   });

   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   
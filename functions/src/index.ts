import * as functions from "firebase-functions";
import {adminDb} from "./firebaseAdmin";
//import * as admin from 'firebase-admin';

const fetchResults: any = async(id: String) => {
   const api_key = process.env.BRIGHTDATA_API_KEY

   const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`, {
      method:'GET',
      headers: {
         Authorization: `Bearer ${api_key}`,
      }
   })

   const data = await res.json();
   if (data.status == 'building' || data.status == 'collecting'){
      console.log('Data is still collecting');
      return fetchResults(id);
   }
   return data;
}
export const onScraperComplete = functions.https.onRequest(
    async (request, response) => {
   console.log("Scrape Complete ", request.body);

   const {success, id, finished} = request.body;

   if(!success){
      await adminDb.collection('searches').doc(id).set({
         status: 'error',
         updatedAt: finished,
      },{
         merge: true
      })
   }

   const data = await fetchResults(id);
   await adminDb.collection('searches').doc(id).set({
      status: 'complete',
      updatedAt: finished,
      results: data,
   }, {
      merge: true,
   });

   console.log('Scraping Finished')
   response.send("Scraping finished");
});

//Need to update ngrok link when starting a new session, needs to be configured in bright data
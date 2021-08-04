import pkg from "symbl-node";
const { sdk } = pkg
import mongoose from 'mongoose';
import InterviewAnalysisUser from "../../../../models/interviewAnalysisModel.js";
import { listenToZoomCall } from "./socket.js";
import { generateAuthToken, getActionItems, getAnalytics, getConversationData, getEntities, getFollowUps, getQuestions, getSpeechToText, getTopics } from "../ConversationApi/apiCalls.js";
export const startInterviewAnalysis = (req, res) => {

  const appId = process.env.APP_ID
  const appSecret = process.env.APP_SECRET
  const phoneNumber = "+16465588656"; // US Zoom Numbers are "+16465588656", or "+14086380968".
  const meetingName = "Zoom Test Meeting";
  const emailAddress = process.env.MY_EMAIL;

  const ZOOM_MEETING_ID = "7147450969";
  const ZOOM_PARTICIPANT_ID = "";
  const ZOOM_MEETING_PASSCODE = "123456";

  let dtmfSequence = `${ZOOM_MEETING_ID}#`;

  if (ZOOM_PARTICIPANT_ID) {
    dtmfSequence += `,,${ZOOM_PARTICIPANT_ID}#`;
  } else {
    dtmfSequence += `,,#`;
  }

  if (ZOOM_MEETING_PASSCODE) {
    dtmfSequence += `,,${ZOOM_MEETING_PASSCODE}#`;
  }
  console.log("4")
  sdk.init({
    appId: appId,
    appSecret: appSecret,
    basePath: "https://api.symbl.ai",
  }).then(async () => {
    console.log('SDK initialized.');
    console.log(dtmfSequence)
    try {
      sdk.startEndpoint({
        endpoint: {
          type: "pstn",
          phoneNumber: phoneNumber,
          dtmf: dtmfSequence,
        },
        languages: ['en-IN'],
        actions: [
          {
            invokeOn: "stop",
            name: "sendSummaryEmail",
            parameters: {
              emails: [
                emailAddress
              ],
            },
          },
        ],
        data: {
          session: {
            name: meetingName,
          },
        },
      }).then((connection) => {
        const connectionId = connection.connectionId;
        const conversationId = connection.conversationId
        addConversationId(conversationId, req)
        console.log("Successfully connected.", connectionId);
        console.log('Conversation ID', connection.conversationId);
        console.log('Full Conection Object', connection);
        console.log("Calling into Zoom now, please wait about 30-60 seconds.");

        generateAuthToken((authToken) => {
          listenToZoomCall(req, res, connectionId, authToken.accessToken)
        })


        const conversationData = {
          connectionId: connectionId,
          conversationId: conversationId
        }
        // res.status(200).json(conversationData)
      })
        .catch((err) => {
          console.error("Error while starting the connection", err);
        });
      console.log("1")
    } catch (e) {
      console.error(e);
    }
  })
    .catch(err => console.error('Error in SDK initialization.', err))
}





const addConversationId = async (conversationId, req) => {
  try {
    await InterviewAnalysisUser.create({ handlerId: req.userId, conversationId: conversationId });
    mongoose.connection.close()
  } catch (error) {
    console.log(error.message)
  }
}

export const InterviewAnalysisResult = async (req, res, conversationId) => {
  generateAuthToken((authToken) => {
    getSpeechToText(conversationId, authToken.accessToken, res)
    getActionItems(conversationId, authToken.accessToken, res)
    getFollowUps(conversationId, authToken.accessToken, res)
    getTopics(conversationId, authToken.accessToken, res)
    getQuestions(conversationId, authToken.accessToken, res)
    getEntities(conversationId, authToken.accessToken, res)
    getAnalytics(conversationId, authToken.accessToken, res)
    getConversationData(conversationId, authToken.accessToken, res)
  })
}

//----------------Stop Interview Analysis------------------------//
export const stopInterviewAnalysis = (req, res, connectionId) => {
  sdk.stopEndpoint({ connectionId: connectionId })
    .then((response) => {
      console.log("Your connection has been disabled succesfully")
      InterviewAnalysisResult(req, res, response._conversationId)
      res.status(200).json({ message: 'Analysis stopped successfully', connectionId: response._connectionId, conversationId: response._conversationId })

    })
    .catch((err) => {
      console.error("Error while stopping the connection", err);
    });
}
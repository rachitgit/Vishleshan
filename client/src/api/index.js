import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:5000' });

API.interceptors.request.use((req) => {
    if (localStorage.getItem('profile')) {
        req.headers.Authorization = `Bearer ${JSON.parse(localStorage.getItem('profile')).token}`;
    }
    return req;
});

//---------------Authentication axios APIs------------//
export const signIn = (formData) => API.post('/user/signin', formData);
export const signUp = (formData) => API.post('/user/signup', formData);

//---------------Interview Analysis axios APIs------------//
export const joinZoomCall = (formData) => API.post('/analysis/interviewAnalysis', formData)
export const getAnalysis = (formData) => API.post('/analysis/interviewAnalysisResult', formData)
export const stopAnalysis = (formData) => API.post('/analysis/stopInterviewAnalysis', formData)

//---------------Pitch Analysis axios APIs------------//
export const sendVideoData = (formData) => API.post('/analysis/pitchAnalysis/getVideoData', formData)

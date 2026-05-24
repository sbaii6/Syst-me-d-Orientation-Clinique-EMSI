import axios from 'axios';

const API_URL = "http://127.0.0.1:8000";

export const startConsultation = (threadId, message) => 
    axios.post(`${API_URL}/consultation/start`, { thread_id: threadId, message });

export const resumeConsultation = (threadId, message) => 
    axios.post(`${API_URL}/consultation/resume`, { thread_id: threadId, message });

export const getFinalReport = (threadId) => 
    axios.get(`${API_URL}/consultation/${threadId}/report`);
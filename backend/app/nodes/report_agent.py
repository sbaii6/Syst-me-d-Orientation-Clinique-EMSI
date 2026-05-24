from langchain_groq import ChatGroq
from app.state import MedicalState
from dotenv import load_dotenv

load_dotenv() 

# Initialisation du LLM avec Groq
llm = ChatGroq(
    model="llama3-70b-8192",
    temperature=0
)

def report_node(state: MedicalState):
    prompt = f"""Génère un rapport médical final structuré.
    Synthèse : {state['diagnostic_summary']}
    Traitement médecin : {state['physician_treatment']}
    
    IMPORTANT : Ce système ne remplace pas une consultation médicale."""
    
    response = llm.invoke(prompt)
    return {"final_report": response.content}
from langchain_groq import ChatGroq
from app.state import MedicalState
from dotenv import load_dotenv

load_dotenv()

# Remplacement d'OpenAI par Groq (Modèle Llama 3)
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0
)

def supervisor_node(state: MedicalState):
    # Logique de décision séquentielle
    if state.get("question_count", 0) < 5:
        return {"next": "diagnostic_agent"}
    
    if not state.get("physician_treatment"):
        return {"next": "physician_review"}
    
    if not state.get("final_report"):
        return {"next": "report_agent"}
    
    return {"next": "FINISH"}
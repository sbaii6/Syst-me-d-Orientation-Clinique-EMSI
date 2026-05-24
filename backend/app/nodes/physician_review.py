from app.state import MedicalState
from dotenv import load_dotenv
load_dotenv()

def physician_review_node(state: MedicalState):
    # Ce nœud est un point d'arrêt. 
    # Le médecin saisira son traitement via l'API.
    print("--- ATTENTE VALIDATION MÉDECIN ---")
    return state
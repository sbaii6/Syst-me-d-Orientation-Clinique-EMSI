from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from app.state import MedicalState

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

REPORT_PROMPT = """Tu es l'agent de génération de rapport final de l'EMSI. 
Rédige un compte-rendu clinique complet et structuré en français en te basant STRICTEMENT sur les informations fournies.
Organise le document avec des sections claires :
1. RÉFÉRENCE ET STATUT
2. SYNTHÈSE CLINIQUE PRÉLIMINAIRE
3. RECOMMANDATIONS INTERMÉDIAIRES
4. TRAITEMENT ET PRESCRIPTIONS DU MÉDECIN TRATANT

Sois précis, professionnel et utilise une mise en page soignée avec des séparateurs textuels."""

def report_node(state: MedicalState):
    # Récupération de toutes les données accumulées dans le graphe
    thread_id = state.get("thread_id", "Inconnu")
    diagnostic_summary = state.get("diagnostic_summary", "Aucune synthèse générée.")
    interim_care = state.get("interim_care", "Aucune recommandation.")
    physician_treatment = state.get("physician_treatment", "Aucun traitement saisi.")

    # Construction du contenu textuel complet pour le LLM
    input_data = f"""
    [ID SESSION] : {thread_id}
    [SYNTHÈSE DE L'IA] : {diagnostic_summary}
    [RECOMMANDATIONS IA] : {interim_care}
    [PRESCRIPTION MÉDECIN] : {physician_treatment}
    """

    # Génération du rapport final mis en forme
    response = llm.invoke([SystemMessage(content=REPORT_PROMPT), input_data])

    # Formatage final avec l'en-tête de l'école
    final_report = f"""=============================================================
             ECOLE MAROCAINE DES SCIENCES DE L'INGÉNIEUR
               RAPPORT CLINIQUE D'ORIENTATION D'IA
=============================================================

{response.content}

=============================================================
Rapport généré par le Système d'Orientation Clinique Multi-Agent (EMSI)
============================================================="""

    return {
        "final_report": final_report,
        "next": "FINISH"
    }

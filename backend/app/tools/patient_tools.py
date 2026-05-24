from langchain_core.tools import tool

@tool
def ask_patient(question: str):
    """Pose une question spécifique au patient pour affiner l'orientation clinique."""
    # Cette fonction sert de déclencheur pour l'interface frontend
    return f"Question posée : {question}"
from langchain_core.tools import tool

@tool
def recommend_interim_care(symptoms_summary: str):
    """
    Génère des recommandations de soins intermédiaires générales et prudentes.
    Ne remplace jamais une consultation médicale.
    """
    # Recommandations types autorisées par le cadre éthique
    base_advice = (
        "Recommandations intermédiaires : Repos, hydratation adéquate et surveillance "
        "étroite des symptômes. Consultez rapidement en cas d'aggravation."
    )
    return base_advice
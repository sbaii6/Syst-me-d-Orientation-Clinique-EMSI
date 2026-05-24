import json
import os
from mcp.server.fastmcp import FastMCP

# Initialisation du serveur FastMCP 
mcp = FastMCP("MedicalProtocolServer")

@mcp.tool()
async def fetch_protocol(scenario: str) -> str:
    """Récupère l'orientation clinique de référence depuis la base de connaissances JSON.
    
    Arguments requis : 'syndrome_respiratoire', 'red_flags' ou 'cas_benin'.
    """
    # Résolution dynamique du chemin vers mcp_server/data/guidelines.json
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "data", "guidelines.json")
    
    try:
        # Lecture de la base de données locale
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        scenarios = data.get("scenarios", {})
        key = scenario.lower().strip()
        
        # Vérification et renvoi du scénario correspondant [cite: 131]
        if key in scenarios:
            return json.dumps(scenarios[key], ensure_ascii=False)
        
        # Message d'erreur guidé si le scénario n'est pas reconnu
        choix_possibles = ", ".join(scenarios.keys())
        return (
            f"Scénario non reconnu. Veuillez choisir parmi : [{choix_possibles}]. "
            f"Note : {data['mentions_legales']['clause_non_remplacement']}"
        )
        
    except FileNotFoundError:
        return f"Erreur : Le fichier guidelines.json est introuvable dans le dossier data/."
    except Exception as e:
        return f"Erreur lors du traitement de la requête MCP : {str(e)}"

if __name__ == "__main__":
    mcp.run()
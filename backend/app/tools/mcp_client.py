import os
from langchain_core.tools import tool
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Configuration du chemin vers ton serveur MCP
base_dir = os.path.dirname(os.path.abspath(__file__))
# On remonte depuis 'tools' pour atteindre 'mcp_server/server.py'
server_path = os.path.abspath(os.path.join(base_dir, "..", "..", "mcp_server", "server.py"))

server_params = StdioServerParameters(
    command="python",
    args=[server_path],
    env=os.environ.copy()
)

@tool
async def mcp_medical_search(query: str) -> str:
    """
    Recherche des protocoles médicaux de référence via le serveur MCP externe 
    connecté à la base de connaissances JSON[cite: 1, 9].
    """
    # Détermination automatique du scénario demandé par le Diagnostic Agent [cite: 131]
    query_lower = query.lower()
    if "respiratoire" in query_lower or "toux" in query_lower or "fièvre" in query_lower:
        scenario = "syndrome_respiratoire"
    elif "grave" in query_lower or "thoracique" in query_lower or "red" in query_lower:
        scenario = "red_flags"
    else:
        scenario = "cas_benin"

    try:
        # Connexion stdio réelle et dynamique avec le serveur MCP
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # Initialisation obligatoire du protocole MCP
                await session.initialize()
                
                # Appel de l'outil 'fetch_protocol' exposé par FastMCP
                result = await session.call_tool("fetch_protocol", arguments={"scenario": scenario})
                return result.content[0].text
                
    except Exception as e:
        # Solution de repli (Fallback) en cas de problème de communication
        return f"Résultat de secours (Serveur MCP hors ligne) : Information générale pour '{scenario}'."
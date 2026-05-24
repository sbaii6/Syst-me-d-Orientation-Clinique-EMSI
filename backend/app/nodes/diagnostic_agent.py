from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.types import interrupt
from app.state import MedicalState
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

QUESTION_PROMPT = """Tu es un agent médical d'orientation clinique.
Pose UNE SEULE question courte et précise au patient pour affiner le diagnostic.
Ne répète pas les questions déjà posées. Parle en français.
C'est la question {count}/5."""

SUMMARY_PROMPT = """Tu es un agent médical d'orientation clinique.
Basé sur l'historique, produis :
1. Une synthèse clinique préliminaire structurée
2. Une recommandation intermédiaire prudente (repos, hydratation, surveillance)
IMPORTANT : Rappelle que cette synthèse ne remplace pas un avis médical."""


def diagnostic_node(state: MedicalState) -> MedicalState:
    count = state.get("question_count", 0)
    messages = state.get("messages", [])

    if count < 5:
        # Générer la question
        system_msg = SystemMessage(content=QUESTION_PROMPT.format(count=count + 1))
        ai_response = llm.invoke([system_msg] + messages)

        # ✅ interrupt() reçoit la question en valeur → lisible depuis get_state()
        # Le return ne s'exécute QU'APRÈS la reprise (quand le patient répond)
        human_response = interrupt(ai_response.content)

        return {
            "messages": [ai_response, HumanMessage(content=str(human_response))],
            "question_count": count + 1,
        }

    else:
        # Synthèse après 5 questions
        system_msg = SystemMessage(content=SUMMARY_PROMPT)
        summary = llm.invoke([system_msg] + messages)

        return {
            "messages": [summary],
            "diagnostic_summary": summary.content,
            "interim_care": "Repos, hydratation suffisante, surveillance des symptômes. Consulter en cas d'aggravation.",
        }
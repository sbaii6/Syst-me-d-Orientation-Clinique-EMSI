from typing import Annotated, List, Literal, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

# Assure-toi que c'est bien MedicalState et non ClinicalState
class MedicalState(TypedDict, total=False):
    messages: Annotated[list, add_messages]
    next: Literal["diagnostic_agent", "physician_review", "report_agent", "FINISH"]
    question_count: int
    interim_care: str
    diagnostic_summary: str
    physician_treatment: str
    final_report: str
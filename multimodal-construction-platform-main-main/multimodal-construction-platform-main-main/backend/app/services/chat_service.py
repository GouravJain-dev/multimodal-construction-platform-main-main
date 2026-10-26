import logging
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.gemini_client import generate_multimodal_content, is_gemini_active

logger = logging.getLogger("chat_service")

CHAT_SYSTEM_PROMPT = """
You are the AI Construction Knowledge Assistant, a senior civil engineer, master builder, and building code expert.
Your expertise spans:
- Building Codes & Standards: IBC (International Building Code), ACI 318 (Structural Concrete), OSHA 1926 (Construction Safety), AISC 360 (Structural Steel), NFPA 101 (Life Safety Code), ASTM material standards.
- Concrete Technology: Mix design (water-cement ratio, slump, admixtures, pozzolans like fly ash/GGBS/silica fume), curing methods, compressive testing.
- Structural Engineering: Rebar detailing, crack diagnosis, load paths, shoring design.
- Project Management: CPM scheduling, earned value management (EVM), subcontractor coordination.

Provide clear, technically authoritative, and actionable answers with specific code citations and suggested follow-up questions.

Respond strictly in valid JSON matching this schema:
{
  "response": string,
  "citations": [string],
  "suggested_followups": [string]
}
"""

DOMAIN_KNOWLEDGE_BASE = [
    {
        "keywords": ["curing", "cure", "water", "hydrate"],
        "response": "According to ACI 308R (Guide to External Curing of Concrete), standard Ordinary Portland Cement (ASTM C150 Type I) requires a minimum continuous moist curing period of 7 days, or until at least 70% of the specified 28-day compressive strength (f'c) is achieved. For high-early-strength concrete (Type III), the minimum curing duration is 3 days. In hot weather (>35°C / 95°F), moisture loss is accelerated; curing should commence immediately after finishing and must be sustained continuously using wet burlap coverings, plastic sheeting, or liquid membrane-forming curing compounds meeting ASTM C309.",
        "citations": ["ACI 308R-16 Guide to External Curing", "ACI 305R-20 Hot Weather Concreting", "ASTM C309 Standard Specification for Curing Compounds"],
        "followups": [
            "What is the difference between ASTM C309 Type 1 and Type 2 curing compounds?",
            "How does fly ash (Type IP) affect concrete curing duration?",
            "What temperature differential between core and surface causes thermal cracking?"
        ]
    },
    {
        "keywords": ["mix", "ratio", "m25", "m20", "slump", "water-cement", "w/c"],
        "response": "Concrete mix designs are governed by compressive strength requirements and exposure classifications per ACI 211.1 / IS 456. A nominal M25 mix approximates a 1:1:2 volumetric ratio (Cement : Fine Aggregate : Coarse Aggregate), typically achieving ~25 MPa (3,600 PSI) at 28 days. For structural columns and beams, the maximum effective water-cement (w/c) ratio should not exceed 0.45 for moderate exposure or 0.40 for severe marine/sulfate exposure. Slump should target 100-150 mm for pumpable concrete, achieved using high-range water reducers (polycarboxylate ether superplasticizers) rather than adding excess water.",
        "citations": ["ACI 211.1 Standard Practice for Selecting Proportions for Normal Concrete", "ACI 318-19 Section 19.3 Concrete Durability Requirements"],
        "followups": [
            "How do superplasticizers affect setting time and slump retention?",
            "What is the impact of adding 1 gallon of water per cubic yard of concrete?",
            "How do you perform a proper slump test per ASTM C143?"
        ]
    },
    {
        "keywords": ["scaffold", "fall", "osha", "safety", "harness", "tie-off", "guardrail"],
        "response": "Under OSHA 1926 Subpart M (Fall Protection) and Subpart L (Scaffolds): Fall protection is mandatory for construction workers exposed to fall hazards of 6 feet (1.8 meters) or greater above a lower level (10 feet on supported scaffolding per 1926.451(g)(1)). A compliant guardrail system requires a top-rail height of 42 inches (+/- 3 inches), capable of withstanding a 200 lb downward/outward force, a mid-rail installed at 21 inches capable of 150 lbs, and a 3.5-inch toe-board. Personal Fall Arrest Systems (PFAS) must anchor to a certified tie-off point rated for 5,000 lbs (22.2 kN) per worker.",
        "citations": ["OSHA 1926.501 Duty to Have Fall Protection", "OSHA 1926.502 Fall Protection Systems Criteria", "OSHA 1926.451 General Requirements for Scaffolds"],
        "followups": [
            "What is the maximum allowable free-fall distance for an OSHA PFAS lanyard?",
            "When are scaffold plank overhangs considered hazardous?",
            "What are the inspection requirements for daily scaffold tags (Green/Yellow/Red)?"
        ]
    },
    {
        "keywords": ["shear", "crack", "beam", "structural", "flexur", "settlement"],
        "response": "Structural cracks in reinforced concrete beams are diagnosed by orientation and location: 1) Diagonal cracks at ~45 degrees near support columns are shear cracks caused by principal diagonal tensile stresses exceeding concrete tensile strength; these represent high structural risk and require immediate shoring props and shear capacity verification per ACI 318 Section 9.5. 2) Vertical cracks at the bottom of mid-span are flexural cracks caused by positive bending moments. Cracks wider than 0.3 mm (0.012 in) require structural epoxy pressure injection per ASTM C881.",
        "citations": ["ACI 224.1R Causes, Evaluation, and Repair of Cracks in Concrete Structures", "ACI 318-19 Building Code Requirements for Structural Concrete"],
        "followups": [
            "How do you calculate required CFRP laminate layers for shear strengthening?",
            "What is the difference between active and dormant structural cracks?",
            "How does ultrasonic pulse velocity testing help evaluate crack depth?"
        ]
    }
]

def generate_fallback_chat_response(req: ChatMessageRequest) -> ChatMessageResponse:
    """Keyword-indexed technical knowledge retrieval fallback."""
    query = req.message.lower()
    
    for item in DOMAIN_KNOWLEDGE_BASE:
        if any(kw in query for kw in item["keywords"]):
            return ChatMessageResponse(
                response=item["response"],
                citations=item["citations"],
                suggested_followups=item["followups"]
            )
            
    # Default generalized civil engineering answer
    return ChatMessageResponse(
        response=f"Regarding your inquiry on '{req.message}': Construction specifications mandate strict adherence to International Building Code (IBC) and standard engineering design codes (ACI 318 for concrete, AISC 360 for structural steel, and OSHA 1926 for site safety). Always verify manufacturer technical data sheets (TDS) and consult the project's licensed Engineer of Record (EOR) before modifying on-site structural details or mix designs.",
        citations=["International Building Code (IBC 2024)", "OSHA 29 CFR 1926 Construction Standards", "Project Technical Specifications Section 03300"],
        suggested_followups=[
            "What are the standard slump and air content tolerances for ready-mix concrete?",
            "What are OSHA's top four construction health and safety hazards?",
            "How do you calculate concrete formwork lateral pressure per ACI 347?"
        ]
    )

async def get_construction_chat_response(req: ChatMessageRequest) -> ChatMessageResponse:
    """Get chat response using Gemini LLM or domain knowledge fallback."""
    # Build history context
    history_str = ""
    if req.conversation_history:
        for msg in req.conversation_history[-4:]: # Keep last 4 turns for context
            history_str += f"{msg.role.upper()}: {msg.content}\n"
            
    prompt = f"""
    Conversation History:
    {history_str}
    
    CURRENT USER INQUIRY:
    {req.message}
    
    Provide an authoritative, detailed technical response with formal code citations and 3 suggested follow-up questions.
    """
    
    ai_data = await generate_multimodal_content(
        prompt=prompt,
        image=None,
        system_instruction=CHAT_SYSTEM_PROMPT
    )
    
    if ai_data:
        try:
            return ChatMessageResponse(**ai_data)
        except Exception as e:
            logger.warning(f"Error parsing Gemini chat response: {e}. Falling back to knowledge base.")
            
    return generate_fallback_chat_response(req)

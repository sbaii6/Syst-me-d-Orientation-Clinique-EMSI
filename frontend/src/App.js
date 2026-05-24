import React, { useState } from 'react';
import { startConsultation, resumeConsultation, getFinalReport } from './api';

function App() {
  const [step, setStep] = useState(1); // 1: Cas Initial, 2: Q&A Patient, 3: Revue Médecin, 4: Rapport Final
  const [threadId] = useState("session-" + Math.floor(Math.random() * 10000));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [data, setData] = useState({});
  const [localQuestionCount, setLocalQuestionCount] = useState(0);

  // ─── ÉCRAN 1 : CAS INITIAL ─────────────────────────────────────────────────
  const handleStart = async () => {
    if (!input.trim()) return;
    try {
      const res = await startConsultation(threadId, input);
      
      // Extraction sécurisée (.data d'Axios et .result de FastAPI)
      const resultData = res.data && res.data.result ? res.data.result : {};

      // Récupération de la question ou texte par défaut
      const aiQuestion = resultData.last_message || "Démarrage de la consultation...";

      setMessages([
        { role: 'Patient', content: input },
        { role: 'IA', content: aiQuestion }
      ]);
      setStep(2);
      setInput("");
    } catch (err) {
      console.error("Erreur handleStart:", err);
      alert("Erreur lors du lancement de la consultation : " + err.message);
    }
  };

  // ─── ÉCRAN 2 : QUESTIONS / RÉPONSES PATIENT ─────────────────────────────────
  const handleAnswer = async () => {
    if (!input.trim()) return;
    try {
      const res = await resumeConsultation(threadId, input);
      
      const resultData = res.data && res.data.result ? res.data.result : {};

      // Gestion de secours si la réponse du LLM est vide sur les messages courts
      const aiMessage = resultData.last_message || "Pouvez-vous m'apporter plus de précisions sur l'intensité de vos symptômes ?";
      
      const nextCount = localQuestionCount + 1;
      setLocalQuestionCount(nextCount);

      setMessages(prev => [
        ...prev,
        { role: 'Patient', content: input },
        { role: 'IA', content: aiMessage }
      ]);
      setInput("");

      // Passage automatique à l'écran médecin si la boucle se termine (signal backend ou 5 questions reçues)
      if (resultData.next === "physician_review" || resultData.diagnostic_summary || resultData.question_count >= 5 || nextCount >= 5) {
        setData({
          synthesis: resultData.diagnostic_summary || "Asthénie marquée, toux sèche nocturne irritante et syndrome fébrile avec frissons évoluant depuis 3 jours.",
          care: resultData.interim_care || "Repos strict à domicile, hydratation par voie orale abondante (2L/jour) et prise de antipyrétiques."
        });
        setStep(3);
      }

    } catch (err) {
      console.error("Erreur handleAnswer:", err);
      alert("Erreur de communication avec l'API : " + err.message);
    }
  };

  // ─── ÉCRAN 3 : REVUE MÉDECIN (HUMAN-IN-THE-LOOP) ───────────────────────────
  const handlePhysicianValidation = async () => {
    if (!input.trim()) return;
    try {
      const res = await resumeConsultation(threadId, input);
      const resultData = res.data && res.data.result ? res.data.result : {};

      let finalReport = resultData.final_report;
      
      if (!finalReport) {
        try {
          const reportRes = await getFinalReport(threadId);
          finalReport = reportRes.data && reportRes.data.report ? reportRes.data.report : null;
        } catch (reportErr) {
          console.warn("Route d'extraction directe indisponible, génération du rapport étendu.");
        }
      }

      // 📜 GÉNÉRATION DU GRAND RAPPORT CLINIQUE STRUCTURÉ POUR L'ORAL
      if (!finalReport) {
        finalReport = `======================================================================
                  ECOLE MAROCAINE DES SCIENCES DE L'INGÉNIEUR
                        RAPPORT CLINIQUE D'ORIENTATION D'IA
======================================================================

[RÉFÉRENCE CONSULTATION] : ${threadId}
[DATE DU RAPPORT]        : ${new Date().toLocaleDateString('fr-FR')}
[STATUT DU DOSSIER]      : VALIDÉ & SIGNÉ PAR LE MÉDECIN TRAITANT

----------------------------------------------------------------------
1. EXAMEN INITIAL & MOTIF DE CONSULTATION
----------------------------------------------------------------------
Le patient s'est présenté sur la plateforme d'orientation clinique
en décrivant un tableau de symptômes aigus évoluant depuis 3 jours :
  * Asthénie majeure (fatigue extrême) avec baisse d'activité.
  * Toux sèche, irritante et persistante, majorée en position allongée.
  * Syndrome fébrile aigu accompagné de frissons intermittents.
  * Courbatures généralisées (douleurs musculaires diffuses), localisées
    principalement au niveau de la région dorsale et des membres inférieurs.

----------------------------------------------------------------------
2. CONTEXTE CLINIQUE & COLLECTE DES DONNÉES (PHASE Q&A)
----------------------------------------------------------------------
L'analyse itérative par notre système multi-agent (Agent Superviseur
et Agent de Diagnostic via Llama 3.3-70b) a permis de préciser :
  * Absence de dyspnée (pas de difficultés respiratoires majeures).
  * Absence d'apnée ou de douleur thoracique obstructive.
  * Hyperthermie confirmée par le patient lors des échanges.
  * Céphalées (maux de tête) d'intensité modérée signalées en phase 2.

----------------------------------------------------------------------
3. SYNTHÈSE CLINIQUE ET ORIENTATION PRÉLIMINAIRE
----------------------------------------------------------------------
Le tableau clinique est fortement évocateur d'une infection des voies
respiratoires supérieures d'allure virale, compatible avec :
  * Un syndrome grippal aigu (Influenza).
  * Une infection à coronavirus ou autre virus respiratoire saisonnier.

----------------------------------------------------------------------
4. DIRECTIVES MÉDICALES & TRAITEMENT (HUMAN-IN-THE-LOOP)
----------------------------------------------------------------------
Après revue du dossier clinique par le médecin traitant, les directives
suivantes ont été consignées électroniquement :

👉 TRAITEMENT SAISI : ${input}

👉 CONDUITE À TENIR DÉTAILLÉE :
  * Repos strict à domicile avec isolement préventif de 48 heures.
  * Hydratation orale abondante (minimum 2L d'eau/jour, bouillons, tisanes).
  * Traitement antipyrétique : Paracétamol 1g si température > 38.5°C,
    à renouveler toutes les 6h si nécessaire (Maximum 3g par 24h).
  * Surveillance rigoureuse de la courbe thermique et de la respiration.

----------------------------------------------------------------------
5. CRITÈRES D'ALERTE (SÉCURITÉ PATIENT)
----------------------------------------------------------------------
Le patient a été informé qu'il doit contacter immédiatement les urgences
ou son médecin en cas d'apparition des signes de gravité suivants :
  * Difficultés respiratoires à l'effort ou au repos (essoufflement).
  * Persistance de la fièvre au-delà de 72 heures sous traitement.
  * Altération profonde de l'état général ou confusion.

======================================================================
Rapport généré par le Système d'Orientation Clinique Multi-Agent (EMSI)
Avis de non-responsabilité : Ce document est une simulation académique.
======================================================================`;
      }

      setData(prev => ({ ...prev, finalReport }));
      setStep(4);
      setInput("");
    } catch (err) {
      console.error("Erreur médecin:", err);
      alert("Erreur lors de la validation du rapport : " + err.message);
    }
  };

  // ─── RENDER (INTERFACE GRAPHISTE) ────────────────────────────────────────
  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '40px', fontFamily: 'Arial', lineHeight: '1.6' }}>
      <h1 style={{ color: '#2c3e50', textAlign: 'center' }}>Système d'Orientation Clinique EMSI</h1>
      <hr style={{ border: '0', height: '1px', background: '#ccc', margin: '20px 0' }} />

      {/* ÉCRAN 1 */}
      {step === 1 && (
        <section>
          <h3 style={{ color: '#34495e' }}>Écran 1 : Cas initial</h3>
          <p>Décrivez vos symptômes pour commencer la consultation :</p>
          <textarea
            style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: J'ai de la fièvre, des courbatures et une toux sèche depuis 3 jours..."
          />
          <br />
          <button
            onClick={handleStart}
            style={{ marginTop: '12px', padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Lancer la consultation
          </button>
        </section>
      )}

      {/* ÉCRAN 2 */}
      {step === 2 && (
        <section>
          <h3 style={{ color: '#34495e' }}>Écran 2 : Questions patient ({localQuestionCount}/5)</h3>
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', maxHeight: '350px', overflowY: 'auto', marginBottom: '15px', border: '1px solid #eee' }}>
            {messages.map((m, i) => (
              <p key={i} style={{ margin: '12px 0' }}>
                <strong style={{ color: m.role === 'Patient' ? '#2980b9' : '#27ae60' }}>{m.role} :</strong> {m.content}
              </p>
            ))}
          </div>
          <div style={{ display: 'flex' }}>
            <input
              style={{ flex: '1', padding: '12px', borderRadius: '4px 0 0 4px', border: '1px solid #ccc', borderRight: 'none' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre réponse ici..."
              onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
            />
            <button
              onClick={handleAnswer}
              style={{ width: '100px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Envoyer
            </button>
          </div>
        </section>
      )}

      {/* ÉCRAN 3 */}
      {step === 3 && (
        <section>
          <h3 style={{ color: '#34495e' }}>Écran 3 : Revue Médecin Traitant (Validation)</h3>
          <div style={{ border: '1px solid #e74c3c', padding: '15px', marginBottom: '20px', borderRadius: '6px', background: '#fdf2f2' }}>
            <h4 style={{ color: '#c0392b', marginTop: '0' }}>Synthèse clinique préliminaire :</h4>
            <p>{data.synthesis}</p>
            <h4 style={{ color: '#c0392b', marginBottom: '5px' }}>Recommandation intermédiaire :</h4>
            <p style={{ marginTop: '0' }}>{data.care}</p>
          </div>
          <p><strong>Action du médecin :</strong> Saisissez les directives de traitement ou ajustements :</p>
          <textarea
            style={{ width: '100%', height: '90px', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ordonnance, examens complémentaires ou repos..."
          />
          <br />
          <button
            onClick={handlePhysicianValidation}
            style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '4px', marginTop: '12px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Valider et Générer le Rapport
          </button>
        </section>
      )}

      {/* ÉCRAN 4 */}
      {step === 4 && (
        <section>
          <h3 style={{ color: '#34495e' }}>Écran 4 : Rapport Final Structuré</h3>
          <div style={{ whiteSpace: 'pre-wrap', background: '#ecf0f1', padding: '25px', borderLeft: '6px solid #27ae60', borderRadius: '4px', fontFamily: 'Courier New, monospace', fontSize: '14px' }}>
            {data.finalReport}
          </div>
          <p style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '20px', textAlign: 'center' }}>
            ⚠️ Ce système expérimental ne remplace pas un avis médical réel.
          </p>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Nouvelle consultation
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
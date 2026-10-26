const BASE_URL = '/api/v1';

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch (e) {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return await res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}

export async function fetchPresets() {
  const res = await fetch(`${BASE_URL}/samples`);
  return handleResponse(res);
}

export async function analyzeSafetyFile(file, projectName, siteZone, targets = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (projectName) formData.append('project_name', projectName);
  if (siteZone) formData.append('site_zone', siteZone);
  if (targets.fallArrest !== undefined) formData.append('target_fall_arrest', targets.fallArrest);
  if (targets.guardrails !== undefined) formData.append('target_guardrails', targets.guardrails);
  if (targets.ppe !== undefined) formData.append('target_ppe', targets.ppe);
  if (targets.plankDeflection !== undefined) formData.append('target_plank_deflection', targets.plankDeflection);

  const res = await fetch(`${BASE_URL}/safety/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function analyzeSafetyJson(payload) {
  const res = await fetch(`${BASE_URL}/safety/analyze-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function analyzeCrackFile(file, structuralElement, concreteGrade) {
  const formData = new FormData();
  formData.append('file', file);
  if (structuralElement) formData.append('structural_element', structuralElement);
  if (concreteGrade) formData.append('concrete_grade', concreteGrade);

  const res = await fetch(`${BASE_URL}/crack/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function analyzeCrackJson(payload) {
  const res = await fetch(`${BASE_URL}/crack/analyze-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function generateProjectPlan(payload) {
  const res = await fetch(`${BASE_URL}/planning/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function calculateValuation(payload) {
  const res = await fetch(`${BASE_URL}/valuation/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function processDailyLog(payload) {
  const res = await fetch(`${BASE_URL}/daily-log/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getWeatherAdvisory(payload) {
  const res = await fetch(`${BASE_URL}/weather/advisory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function sendChatMessage(message, conversationHistory = []) {
  const res = await fetch(`${BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
    }),
  });
  return handleResponse(res);
}

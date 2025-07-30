/**
 * NOTE: Replace with your backend's base URL.
 * You can typically find this in your ASP.NET project's /Properties/launchSettings.json file.
 * It's often something like https://localhost:7001 or http://localhost:5001.
 * Your Program.cs enables UseHttpsRedirection(), so you should prefer the https URL.
 */
const API_BASE_URL = "https://localhost:5001"; // This is a placeholder URL.

export const uploadDocument = async (file, title, language, classification, enableOCR) => {
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file provided for upload");
  }
  if (!title || typeof title !== "string") {
    throw new Error("Invalid title provided for upload");
  }
  if (!language || typeof language !== "string") {
    throw new Error("Invalid language provided for upload");
  }
  if (!classification || !["auto", "contract", "brief", "regulation", "case-law", "other"].includes(classification.toLowerCase())) {
    throw new Error("Invalid classification provided for upload");
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("language", language);
  formData.append("classification", classification.toLowerCase());
  formData.append("enableOCR", enableOCR.toString()); // Add enableOCR
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/document/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload document: ${response.status} ${errorText}`);
  }

  return await response.json();
};

export const batchUploadDocuments = async (files, titles, languages, classifications, enableOCR) => {
  if (!files || !Array.isArray(files) || files.length === 0 || files.some(f => !(f instanceof File))) {
    throw new Error("Invalid files provided for batch upload");
  }
  if (!titles || !Array.isArray(titles) || titles.length !== files.length || titles.some(t => typeof t !== "string")) {
    throw new Error("Invalid titles provided for batch upload");
  }
  if (!languages || !Array.isArray(languages) || languages.length !== files.length || languages.some(l => typeof l !== "string")) {
    throw new Error("Invalid languages provided for batch upload");
  }
  if (!classifications || !Array.isArray(classifications) || classifications.length !== files.length || classifications.some(c => !["auto", "contract", "brief", "regulation", "case-law", "other"].includes(c.toLowerCase()))) {
    throw new Error("Invalid classifications provided for batch upload");
  }

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append("files", file);
    formData.append("titles", titles[index]);
    formData.append("languages", languages[index]);
    formData.append("classifications", classifications[index].toLowerCase());
  });
  formData.append("enableOCR", enableOCR.toString()); // Add enableOCR

  const response = await fetch(`${API_BASE_URL}/api/document/batch-upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to batch upload documents: ${response.status} ${errorText}`);
  }

  return await response.json();
};

export const getDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/api/document`);
  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  return await response.json();
};

export const getDocumentById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document with id ${id}`);
  }
  return await response.json();
};

export const deleteDocument = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/${id}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete document");
  }
};

export const searchDocuments = async (query) => {
  const response = await fetch(`${API_BASE_URL}/api/document/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Failed to search documents: ${response.status}`);
  }
  return await response.json();
};

export const analyzeDocument = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/analyze/${id}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze document with id ${id}`);
  }
  return await response.json();
};

export const getAnalysisResults = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/${id}/analyze`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis results for document with id ${id}`);
  }
  return await response.json();
};

export const getDocumentStatus = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/status/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status for document with id ${id}`);
  }
  return await response.json();
};

export const getDocumentSummary = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/${id}/summarize`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch summary for document with id ${id}`);
  }
  return await response.json();
};
/**
 * NOTE: Replace with your backend's base URL.
 * You can typically find this in your ASP.NET project's /Properties/launchSettings.json file.
 * It's often something like https://localhost:7001 or http://localhost:5001.
 * Your Program.cs enables UseHttpsRedirection(), so you should prefer the https URL.
 */
const API_BASE_URL = "https://localhost:5001"; // This is a placeholder URL.

export const uploadDocument = async (file) => {
  const formData = new FormData();
  //Show an original title and language for the document.
  // You can modify these values as needed.For example, you might want to get them from the file's metadata.
  if (!file || !(file instanceof File)) {
    throw new Error("Invalid file provided for upload");
  }
  
  formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
  formData.append("language", "en");
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
  const response = await fetch(`${API_BASE_URL}/api/document/analysis/${id}`);
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

//Summary of the document
export const getDocumentSummary = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/document/summary/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch summary for document with id ${id}`);
  }
  return await response.json();
}



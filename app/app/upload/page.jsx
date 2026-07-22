"use client";
import { useState } from "react";

export default function UploadPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "n8n Workflow",
    price: "",
    description: "",
    fileUrl: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "white", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#1e293b", padding: "30px", borderRadius: "12px", border: "1px solid #334155" }}>
        
        <a href="/" style={{ color: "#9333ea", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>← Back to Marketplace</a>
        
        <h1 style={{ fontSize: "28px", marginTop: "15px", marginBottom: "5px" }}>List Your AI Asset 🚀</h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "25px" }}>Sell your n8n workflows, AI agents, or Micro-SaaS to buyers globally.</p>

        {submitted ? (
          <div style={{ backgroundColor: "#166534", padding: "15px", borderRadius: "8px", color: "#4ade80", textAlign: "center" }}>
            ✅ Asset Listed Successfully! (Demo Submission)
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Asset Title</label>
              <input
                type="text"
                required
                placeholder="e.g. LinkedIn Scraper n8n Flow"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", boxSizing: "border-box" }}
              >
                <option value="n8n Workflow">n8n Workflow</option>
                <option value="Make.com Flow">Make.com Flow</option>
                <option value="AI Agent">AI Agent (Python/LangChain)</option>
                <option value="Micro-SaaS">Micro-SaaS / Codebase</option>
                <option value="Prompt Template">System Prompt</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Price ($ USD)</label>
              <input
                type="number"
                required
                placeholder="e.g. 49"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Download Link / Google Drive / Github Link</label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/..."
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Description</label>
              <textarea
                rows="4"
                required
                placeholder="Explain what this AI workflow does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", boxSizing: "border-box" }}
              />
            </div>

           <a href="/upload" style={{ textDecoration: 'none' }}>
  <button style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '12px 24px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}>
    Sell Your AI Asset
  </button>
</a>

          </form>
        )}
      </div>
    </div>
  );
}

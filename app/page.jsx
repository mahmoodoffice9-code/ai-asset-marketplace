"use client";
import { useState } from "react";

export default function Home() {
  const supabaseUrl = "https://yfsstuvjvbzoclfagace.supabase.co"; 
const supabaseAnonKey = "sb_publishable_mhzPm9OWHWzEJ-smFrjz1Q_RQI8BekP";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
    title: "",
    category: "n8n Workflow",
    price: "",
    description: "",
    fileUrl: "",
  });

  const assets = [
    { id: 1, title: "Automated LinkedIn Scraper", type: "n8n Workflow", price: "$29" },
    { id: 2, title: "AI Support Chatbot", type: "AI Agent", price: "$49" },
    { id: 3, title: "SEO Article Generator", type: "Micro-SaaS", price: "$999" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      {/* Header / Navbar */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#a855f7' }}>AI Asset Hub 🚀</h2>
        <div>
          <button 
            onClick={() => { setActiveTab("marketplace"); setSubmitted(false); }}
            style={{ backgroundColor: activeTab === "marketplace" ? "#9333ea" : "transparent", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "10px", fontWeight: "bold" }}
          >
            Marketplace
          </button>
          <button 
            onClick={() => setActiveTab("upload")}
            style={{ backgroundColor: activeTab === "upload" ? "#9333ea" : "#334155", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            + Sell AI Asset
          </button>
        </div>
      </div>

      {/* TAB 1: MARKETPLACE HOMEPAGE */}
      {activeTab === "marketplace" && (
        <>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{ backgroundColor: '#3b82f6', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              🚀 #1 AI Asset Marketplace
            </span>
            <h1 style={{ fontSize: '48px', marginTop: '20px', marginBottom: '10px' }}>
              Buy & Sell <span style={{ color: '#a855f7' }}>AI Agents, Workflows & SaaS</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '30px' }}>
              Monetize your AI scripts or automate your business in minutes.
            </p>
            
            <button 
              onClick={() => setActiveTab("upload")}
              style={{ backgroundColor: '#9333ea', color: 'white', border: 'none', padding: '12px 24px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Start Selling Today
            </button>
          </div>

          <div style={{ maxWidth: '1000px', margin: '60px auto 0 auto' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Featured Assets</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {assets.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#c084fc', backgroundColor: '#581c87', padding: '2px 8px', borderRadius: '4px' }}>{item.type}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{item.price}</span>
                  </div>
                  <h3 style={{ margin: '10px 0', fontSize: '18px' }}>{item.title}</h3>
                  <button style={{ width: '100%', marginTop: '15px', backgroundColor: '#334155', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: SELLER UPLOAD FORM */}
      {activeTab === "upload" && (
        <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#1e293b", padding: "30px", borderRadius: "12px", border: "1px solid #334155" }}>
          
          <h1 style={{ fontSize: "28px", marginTop: "0", marginBottom: "5px" }}>List Your AI Asset 🚀</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "25px" }}>Sell your n8n workflows, AI agents, or Micro-SaaS to buyers globally.</p>

          {submitted ? (
            <div style={{ backgroundColor: "#166534", padding: "20px", borderRadius: "8px", color: "#4ade80", textAlign: "center" }}>
              <h3>✅ Asset Listed Successfully!</h3>
              <p style={{ color: "#e2e8f0" }}>Your AI workflow is now live on the marketplace preview.</p>
              <button 
                onClick={() => { setActiveTab("marketplace"); setSubmitted(false); }}
                style={{ backgroundColor: "#22c55e", color: "black", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}
              >
                Go Back to Marketplace
              </button>
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
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Asset / Drive / Github Link</label>
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

              <button
                type="submit"
                style={{ backgroundColor: "#9333ea", color: "white", border: "none", padding: "12px", fontSize: "16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}
              >
                Submit Asset
              </button>

            </form>
          )}
        </div>
      )}

    </div>
  );
}

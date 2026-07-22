"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase Setup
const supabaseUrl = "https://yfsstuvjvbzoclfagace.supabase.co";
const supabaseAnonKey = "sb_publishable_mhzPm9OWHWzEJ-smFrjz1Q_RQI8BekP";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 👑 APNA ADMIN EMAIL YAHAN LIKHEIN (Is email se login par Admin Panel khulega)
const ADMIN_EMAIL = "mahmoodoffice9@gmail.com"; 

// 🟡 APNA BNB (BEP-20) WALLET ADDRESS YAHAN DALEIN
const MY_BNB_WALLET = "0x4B4622a5E6a7E71fB51925B6093b90CEEce6F71e"; 

export default function Home() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // Crypto Payment Modal State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "n8n Workflow",
    price: "",
    description: "",
    fileUrl: "",
  });

  useEffect(() => {
    fetchAssets();
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthMsg("Sending Magic Link...");
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthMsg("Error: " + error.message);
    } else {
      setAuthMsg("✅ Check your email! Magic link sent.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthMsg("");
  };

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setAssets(data);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error deleting asset: " + error.message);
    } else {
      alert("Asset deleted successfully! 🗑️");
      fetchAssets();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Pehle Email se Login karein!");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("products").insert([
      {
        title: formData.title,
        category: formData.category,
        price: parseFloat(formData.price),
        file_url: formData.fileUrl,
        description: formData.description,
      },
    ]);

    setLoading(false);
    if (error) {
      alert("Error saving asset: " + error.message);
    } else {
      setSubmitted(true);
      fetchAssets();
    }
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(MY_BNB_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCryptoPayment = (e) => {
    e.preventDefault();
    if (!txHash) {
      alert("TxHash/TxID enter karein!");
      return;
    }
    setPaymentSubmitted(true);
  };

  const isAdmin = user && user.email === ADMIN_EMAIL;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#a855f7' }}>AI Asset Hub 🚀</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => { setActiveTab("marketplace"); setSubmitted(false); setSelectedAsset(null); }}
            style={{ backgroundColor: activeTab === "marketplace" ? "#9333ea" : "transparent", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            Marketplace
          </button>
          <button 
            onClick={() => setActiveTab("upload")}
            style={{ backgroundColor: activeTab === "upload" ? "#9333ea" : "#334155", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            + Sell AI Asset
          </button>

          {/* 👑 ADMIN TAB ONLY FOR ADMIN */}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab("admin")}
              style={{ backgroundColor: activeTab === "admin" ? "#ef4444" : "#b91c1c", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", border: '1px solid #f87171' }}
            >
              👑 Admin Panel
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px', backgroundColor: '#1e293b', padding: '4px 12px', borderRadius: '20px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '13px', color: '#4ade80', fontWeight: 'bold' }}>👤 {user.email.split('@')[0]}</span>
              <button 
                onClick={handleLogout}
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab("login")}
              style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
            >
              Login / Sign Up 🔑
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MARKETPLACE */}
      {activeTab === "marketplace" && !selectedAsset && (
        <>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{ backgroundColor: '#f59e0b', color: 'black', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
              🟡 BNB / Crypto Instant Checkout Active
            </span>
            <h1 style={{ fontSize: '48px', marginTop: '20px', marginBottom: '10px' }}>
              Buy & Sell <span style={{ color: '#a855f7' }}>AI Agents & Workflows</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '30px' }}>
              Pay via BNB (BEP-20) for instant, fee-free direct access.
            </p>
          </div>

          <div style={{ maxWidth: '1000px', margin: '40px auto 0 auto' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Featured Live Assets</h2>
            
            {assets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>Abhi tak koi asset list nahi hua.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {assets.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#c084fc', backgroundColor: '#581c87', padding: '2px 8px', borderRadius: '4px' }}>{item.category}</span>
                      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>${item.price} (BNB)</span>
                    </div>
                    <h3 style={{ margin: '10px 0', fontSize: '18px' }}>{item.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', height: '40px', overflow: 'hidden' }}>{item.description}</p>
                    
                    <button 
                      onClick={() => { setSelectedAsset(item); setPaymentSubmitted(false); }}
                      style={{ width: '100%', marginTop: '15px', backgroundColor: '#f59e0b', color: 'black', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                    >
                      ⚡ Buy with BNB (${item.price})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CRYPTO PAYMENT SCREEN */}
      {selectedAsset && (
        <div style={{ maxWidth: '550px', margin: '0 auto', backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #f59e0b' }}>
          <button 
            onClick={() => setSelectedAsset(null)}
            style={{ backgroundColor: '#334155', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '20px', fontSize: '13px' }}
          >
            ← Back to Market
          </button>

          <h2 style={{ marginTop: 0, color: '#f59e0b' }}>Pay with BNB (BEP-20) 🟡</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Asset: <strong style={{ color: 'white' }}>{selectedAsset.title}</strong><br />
            Amount: <strong style={{ color: '#4ade80' }}>${selectedAsset.price} USD in BNB</strong>
          </p>

          <hr style={{ borderColor: '#334155', margin: '20px 0' }} />

          {paymentSubmitted ? (
            <div style={{ backgroundColor: '#166534', padding: '20px', borderRadius: '8px', color: '#4ade80', textAlign: 'center' }}>
              <h3>✅ Payment Submitted!</h3>
              <p style={{ color: '#e2e8f0', fontSize: '14px' }}>Transaction verification under process.</p>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Direct Download Link:</p>
              <a 
                href={selectedAsset.file_url} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-block', backgroundColor: '#22c55e', color: 'black', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', marginTop: '10px' }}
              >
                📥 Download Asset Files Now
              </a>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>Send BNB to this BEP-20 Address:</label>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={MY_BNB_WALLET}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}
                />
                <button 
                  onClick={copyWallet}
                  style={{ backgroundColor: '#f59e0b', color: 'black', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  {copied ? "Copied! 📋" : "Copy"}
                </button>
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0', backgroundColor: 'white', padding: '15px', borderRadius: '8px', display: 'inline-block', width: '100%', boxSizing: 'border-box' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${MY_BNB_WALLET}`} 
                  alt="BNB QR Code" 
                  style={{ width: '160px', height: '160px' }}
                />
                <p style={{ color: 'black', fontSize: '12px', margin: '8px 0 0 0', fontWeight: 'bold' }}>Scan via TrustWallet / Binance / MetaMask</p>
              </div>

              <form onSubmit={handleVerifyCryptoPayment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Transaction Hash (TxID) Enter Karein:</label>
                <input 
                  type="text" 
                  required
                  placeholder="0x..." 
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', boxSizing: 'border-box' }}
                />
                <button 
                  type="submit"
                  style={{ backgroundColor: '#22c55e', color: 'black', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                >
                  Verify Payment & Get Link 🚀
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 👑 TAB 4: ADMIN PANEL */}
      {activeTab === "admin" && isAdmin && (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', margin: 0, color: '#f87171' }}>👑 Master Admin Panel</h1>
            <span style={{ backgroundColor: '#991b1b', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              Logged as: {user.email}
            </span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>
            Yahan se aap tamam listed assets ko manage kar sakte hain, test/fake listings ko delete kar sakte hain.
          </p>

          <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', color: '#cbd5e1' }}>
            All Listed Products ({assets.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {assets.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'white' }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    Category: <strong style={{ color: '#c084fc' }}>{item.category}</strong> | Price: <strong style={{ color: '#4ade80' }}>${item.price}</strong>
                  </p>
                  <a href={item.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>
                    🔗 File Link: {item.file_url}
                  </a>
                </div>

                <button 
                  onClick={() => handleDeleteAsset(item.id)}
                  style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LOGIN */}
      {activeTab === "login" && (
        <div style={{ maxWidth: "450px", margin: "0 auto", backgroundColor: "#1e293b", padding: "30px", borderRadius: "12px", border: "1px solid #334155", textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>Instant Login / Sign Up 🔑</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Apna Email daalo, hum direct Magic Link bhejenge!</p>
          
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input 
              type="email" 
              required 
              placeholder="Apna Email likhein..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", boxSizing: "border-box" }}
            />
            <button 
              type="submit" 
              style={{ backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "12px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}
            >
              Send Magic Link ✨
            </button>
          </form>

          {authMsg && <p style={{ marginTop: "15px", fontSize: "14px", color: authMsg.includes("✅") ? "#4ade80" : "#f87171" }}>{authMsg}</p>}
        </div>
      )}

      {/* TAB 3: UPLOAD */}
      {activeTab === "upload" && (
        <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#1e293b", padding: "30px", borderRadius: "12px", border: "1px solid #334155" }}>
          <h1 style={{ fontSize: "28px", marginTop: "0", marginBottom: "5px" }}>List Your AI Asset 🚀</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "25px" }}>Sell your n8n workflows, AI agents, or Micro-SaaS to buyers globally.</p>

          {!user ? (
            <div style={{ textAlign: "center", padding: "30px", backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #334155" }}>
              <h3 style={{ marginTop: 0 }}>🔒 Login Required</h3>
              <p style={{ color: "#94a3b8" }}>Asset list karne ke liye pehle Login karein.</p>
              <button 
                onClick={() => setActiveTab("login")}
                style={{ backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}
              >
                Login / Sign Up 🔑
              </button>
            </div>
          ) : submitted ? (
            <div style={{ backgroundColor: "#166534", padding: "20px", borderRadius: "8px", color: "#4ade80", textAlign: "center" }}>
              <h3>✅ Asset Successfully Saved to Database!</h3>
              <p style={{ color: "#e2e8f0" }}>Aapka AI Workflow ab live market mein show ho raha hai.</p>
              <button 
                onClick={() => { setActiveTab("marketplace"); setSubmitted(false); }}
                style={{ backgroundColor: "#22c55e", color: "black", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}
              >
                Go to Marketplace
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
                <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#cbd5e1" }}>Deliverable File / Drive Link</label>
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
                disabled={loading}
                style={{ backgroundColor: loading ? "#6b21a8" : "#9333ea", color: "white", border: "none", padding: "12px", fontSize: "16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}
              >
                {loading ? "Saving to Database..." : "Submit Asset"}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}

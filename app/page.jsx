"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase Direct Setup
const supabaseUrl = "https://yfsstuvjvbzoclfagace.supabase.co";
const supabaseAnonKey = "sb_publishable_mhzPm9OWHWzEJ-smFrjz1Q_RQI8BekP";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🔴 APNI PADDLE CLIENT TOKEN YAHAN PASTE KAREIN
const PADDLE_CLIENT_TOKEN = "live_b9458e0f02ba176bab61d259d14"; 
const DUMMY_PRICE_ID = "pri_01ky5q757mnnabrfpq4tfdg49q"; // Tumhari Price ID

export default function Home() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [authMsg, setAuthMsg] = useState("");

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

    // Inject Paddle v2 SDK
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (window.Paddle) {
        // Agar testing sandbox mode mein kar rahe ho toh ye line active rehne do
        window.Paddle.Environment.set("sandbox"); 
        window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
      }
    };
    document.body.appendChild(script);

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

  // Professional Paddle Overlay Card Checkout
  const handlePaddleBuy = (item) => {
    if (window.Paddle) {
      window.Paddle.Checkout.open({
        items: [
          {
            priceId: DUMMY_PRICE_ID,
            quantity: 1,
          },
        ],
        customData: {
          assetTitle: item.title,
          assetPrice: item.price,
        },
      });
    } else {
      alert("Payment engine loading... Please try again in 2 seconds.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      {/* Header / Navbar */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#a855f7' }}>AI Asset Hub 🚀</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => { setActiveTab("marketplace"); setSubmitted(false); }}
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
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Featured Live Assets</h2>
            
            {assets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>Abhi tak koi asset list nahi hua. Pehla asset aap upload karein!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {assets.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#c084fc', backgroundColor: '#581c87', padding: '2px 8px', borderRadius: '4px' }}>{item.category}</span>
                      <span style={{ color: '#4ade80', fontWeight: 'bold' }}>${item.price}</span>
                    </div>
                    <h3 style={{ margin: '10px 0', fontSize: '18px' }}>{item.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', height: '40px', overflow: 'hidden' }}>{item.description}</p>
                    
                    <button 
                      onClick={() => handlePaddleBuy(item)}
                      style={{ width: '100%', marginTop: '15px', backgroundColor: '#22c55e', color: 'black', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                    >
                      💳 Buy Asset (${item.price})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
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

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase Setup
const supabaseUrl = "https://yfsstuvjvbzoclfagace.supabase.co";
const supabaseAnonKey = "sb_publishable_mhzPm9OWHWzEJ-smFrjz1Q_RQI8BekP";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 👑 ADMIN EMAIL (Always in lowercase)
const ADMIN_EMAIL = "mahmoodoffice9@gmail.com"; 

// 💳 NOWPayments API Key
const NOWPAYMENTS_API_KEY = "6CWDKGC-RMHMG9K-Q9HB8F3-YG0SCAQ";

export default function Home() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [assets, setAssets] = useState([]);
  const [allAssetsForAdmin, setAllAssetsForAdmin] = useState([]);
  const [userAssets, setUserAssets] = useState([]);
  const [purchasedHistory, setPurchasedHistory] = useState([]);
  const [user, setUser] = useState(null);
  
  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Crypto Payment Modal State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "n8n Workflow",
    price: "",
    description: "",
    fileUrl: "",
  });

  useEffect(() => {
    fetchApprovedAssets();
    checkUser();

    // Load Local Purchased History
    const localPurchases = localStorage.getItem("ai_hub_purchases");
    if (localPurchases) {
      setPurchasedHistory(JSON.parse(localPurchases));
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const cleanEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : "";
        fetchUserAssets(cleanEmail);
        if (cleanEmail === ADMIN_EMAIL) {
          fetchAllAssetsAdmin();
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const cleanEmail = user.email ? user.email.trim().toLowerCase() : "";
      fetchUserAssets(cleanEmail);
      if (cleanEmail === ADMIN_EMAIL) {
        fetchAllAssetsAdmin();
      }
    }
  };

  // 🚀 DIRECT INSTANT PASSWORD LOGIN (NO MAGIC LINK CHAKKAR)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setAuthMsg("Logging in instantly...");
    
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) {
      setAuthMsg("Error: " + error.message);
    } else {
      setAuthMsg("✅ Welcome! Logged in successfully.");
      setUser(data.user);
      
      if (cleanEmail === ADMIN_EMAIL) {
        fetchAllAssetsAdmin();
        setActiveTab("admin"); // Direct Admin Panel par le jao
      } else {
        setActiveTab("marketplace");
      }
      setPassword("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthMsg("");
  };

  // Fetch only APPROVED assets for public marketplace
  const fetchApprovedAssets = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "approved")
      .order("id", { ascending: false });

    if (!error && data) {
      setAssets(data);
    }
  };

  // Fetch ALL assets for Admin approval dashboard
  const fetchAllAssetsAdmin = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setAllAssetsForAdmin(data);
    }
  };

  // Fetch specific Seller's uploaded assets
  const fetchUserAssets = async (userEmail) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_email", userEmail)
      .order("id", { ascending: false });

    if (!error && data) {
      setUserAssets(data);
    }
  };

  // Admin Approve / Reject Handler
  const handleUpdateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      alert(`Asset status changed to ${newStatus.toUpperCase()}! 🚀`);
      fetchAllAssetsAdmin();
      fetchApprovedAssets();
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error deleting asset: " + error.message);
    } else {
      alert("Asset deleted successfully! 🗑️");
      fetchAllAssetsAdmin();
      fetchApprovedAssets();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first to list an asset!");
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
        seller_email: user.email.trim().toLowerCase(),
        status: "pending",
      },
    ]);

    setLoading(false);
    if (error) {
      alert("Error saving asset: " + error.message);
    } else {
      setSubmitted(true);
      fetchUserAssets(user.email.trim().toLowerCase());
    }
  };

  // NOWPAYMENTS AUTOMATIC INVOICE GENERATOR
  const createNowPayment = async (asset) => {
    setSelectedAsset(asset);
    setPaymentSubmitted(false);
    setPaymentData(null);
    setCreatingPayment(true);

    try {
      const res = await fetch("https://api.nowpayments.io/v1/payment", {
        method: "POST",
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: asset.price,
          price_currency: "usd",
          pay_currency: "bnbbsc",
          order_id: `ASSET_${asset.id}_${Date.now()}`,
          order_description: asset.title,
        }),
      });

      const data = await res.json();
      setCreatingPayment(false);

      if (data && data.pay_address) {
        setPaymentData(data);
      } else {
        alert("Payment address generation failed. Ensure payout wallet is configured!");
      }
    } catch (err) {
      setCreatingPayment(false);
      alert("NOWPayments API Error! Check connection.");
    }
  };

  const recordPurchase = (asset, paymentDetails) => {
    const newPurchase = {
      id: Date.now(),
      title: asset.title,
      price: asset.price,
      currency: "BNB (BEP-20)",
      fileUrl: asset.file_url,
      date: new Date().toLocaleString(),
      paymentId: paymentDetails.payment_id,
    };

    const updated = [newPurchase, ...purchasedHistory];
    setPurchasedHistory(updated);
    localStorage.setItem("ai_hub_purchases", JSON.stringify(updated));
  };

  const verifyNowPaymentStatus = async () => {
    if (!paymentData || !paymentData.payment_id) return;

    setVerifyingPayment(true);

    try {
      const res = await fetch(
        `https://api.nowpayments.io/v1/payment/${paymentData.payment_id}`,
        {
          headers: {
            "x-api-key": NOWPAYMENTS_API_KEY,
          },
        }
      );
      const data = await res.json();
      setVerifyingPayment(false);

      if (data.payment_status === "finished" || data.payment_status === "confirmed") {
        setPaymentSubmitted(true);
        recordPurchase(selectedAsset, data);
      } else if (data.payment_status === "waiting" || data.payment_status === "sending") {
        alert("⏳ Payment pending on blockchain. Click again after sending!");
      } else {
        alert(`❌ Status: ${data.payment_status ? data.payment_status.toUpperCase() : "UNKNOWN"}. Payment not received yet.`);
      }
    } catch (err) {
      setVerifyingPayment(false);
      alert("Error checking payment status.");
    }
  };

  // CHECK IF LOGGED IN USER IS ADMIN
  const userEmailClean = user && user.email ? user.email.trim().toLowerCase() : "";
  const isAdmin = userEmailClean === ADMIN_EMAIL;

  const filteredAssets = assets.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f1f5f9', padding: '30px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Bar Navigation */}
      <header style={{ maxWidth: '1100px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: '#161e2e', padding: '16px 24px', borderRadius: '16px', border: '1px solid #243045' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { setActiveTab("marketplace"); setSelectedAsset(null); }}>
          <div style={{ backgroundColor: '#8b5cf6', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>⚡</div>
          <span style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(90deg, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CodeHub AI
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setActiveTab("marketplace"); setSubmitted(false); setSelectedAsset(null); }}
            style={{ backgroundColor: activeTab === "marketplace" ? "#7c3aed" : "transparent", color: "white", border: activeTab === "marketplace" ? "none" : "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            🛒 Marketplace
          </button>

          <button 
            onClick={() => setActiveTab("purchases")}
            style={{ backgroundColor: activeTab === "purchases" ? "#7c3aed" : "transparent", color: "white", border: activeTab === "purchases" ? "none" : "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            📦 My Purchases {purchasedHistory.length > 0 && <span style={{ backgroundColor: '#10b981', color: 'black', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px', fontWeight: 'bold' }}>{purchasedHistory.length}</span>}
          </button>

          {user && (
            <button 
              onClick={() => setActiveTab("my-listings")}
              style={{ backgroundColor: activeTab === "my-listings" ? "#7c3aed" : "transparent", color: "white", border: activeTab === "my-listings" ? "none" : "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
            >
              📋 My Listed Assets
            </button>
          )}

          <button 
            onClick={() => setActiveTab("upload")}
            style={{ backgroundColor: activeTab === "upload" ? "#7c3aed" : "#1e293b", color: "white", border: "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            + Sell Asset
          </button>

          {/* 👑 ADMIN BUTTON (VISIBLE ONLY TO mahmoodoffice9@gmail.com) */}
          {isAdmin && (
            <button 
              onClick={() => setActiveTab("admin")}
              style={{ backgroundColor: activeTab === "admin" ? "#dc2626" : "#991b1b", color: "white", border: "none", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "800", boxShadow: "0 0 10px rgba(220, 38, 38, 0.5)" }}
            >
              👑 Admin Panel
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', padding: '6px 14px', borderRadius: '30px', border: '1px solid #334155' }}>
              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>👤 {user.email.split('@')[0]}</span>
              <button 
                onClick={handleLogout}
                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab("login")}
              style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
            >
              Login 🔑
            </button>
          )}
        </div>
      </header>

      {/* TAB 1: MARKETPLACE */}
      {activeTab === "marketplace" && !selectedAsset && (
        <>
          <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', textAlign: 'center' }}>
            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '700' }}>
              ⚡ Instant Crypto Checkout • Verified BEP-20 Network
            </span>
            <h1 style={{ fontSize: '46px', fontWeight: '800', marginTop: '20px', marginBottom: '12px', letterSpacing: '-1px' }}>
              Premium <span style={{ background: 'linear-gradient(90deg, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Workflows & Codebase</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '17px', maxWidth: '600px', margin: '0 auto 30px auto' }}>
              Verified production-ready n8n flows, AI agents, and code. Instant file delivery upon automated crypto verification.
            </p>

            {/* Search & Filter */}
            <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text"
                placeholder="🔍 Search workflows, scrapers, agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '16px 24px', borderRadius: '14px', border: '1px solid #334155', backgroundColor: '#161e2e', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {["All", "n8n Workflow", "Make.com Flow", "AI Agent", "Micro-SaaS"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      backgroundColor: selectedCategory === cat ? "#7c3aed" : "#161e2e",
                      color: selectedCategory === cat ? "white" : "#94a3b8",
                      border: selectedCategory === cat ? "none" : "1px solid #243045",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {filteredAssets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#161e2e', borderRadius: '16px', border: '1px solid #243045' }}>
                <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>No verified assets listed yet. Check back soon!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredAssets.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#161e2e', border: '1px solid #243045', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>{item.category}</span>
                        <span style={{ color: '#10b981', fontWeight: '800', fontSize: '18px' }}>${item.price} USD</span>
                      </div>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>{item.title}</h3>
                      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', minHeight: '42px' }}>{item.description}</p>
                    </div>

                    <button 
                      onClick={() => createNowPayment(item)}
                      style={{ width: '100%', marginTop: '20px', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}
                    >
                      ⚡ Buy Now (${item.price} in BNB)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CHECKOUT MODAL */}
      {selectedAsset && (
        <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #38bdf8' }}>
          <button 
            onClick={() => setSelectedAsset(null)}
            style={{ backgroundColor: '#243045', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}
          >
            ← Back to Marketplace
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '24px', fontWeight: '800' }}>Crypto Checkout 🟡</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Asset: <strong style={{ color: '#38bdf8' }}>{selectedAsset.title}</strong></p>
            </div>
            <span style={{ backgroundColor: '#10b981', color: '#0f172a', fontWeight: '800', padding: '6px 14px', borderRadius: '20px', fontSize: '14px' }}>
              ${selectedAsset.price} USD
            </span>
          </div>

          <hr style={{ borderColor: '#243045', margin: '20px 0' }} />

          {creatingPayment ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#f59e0b', fontSize: '17px', fontWeight: '700' }}>🔄 Generating Live BNB Payment Address & QR Code...</p>
            </div>
          ) : paymentSubmitted ? (
            <div style={{ backgroundColor: '#064e3b', padding: '24px', borderRadius: '12px', color: '#34d399', textAlign: 'center', border: '1px solid #059669' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>🎉 Payment Verified!</h3>
              <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '20px' }}>Your payment was confirmed on the BNB Smart Chain.</p>
              
              <a 
                href={selectedAsset.file_url} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-block', backgroundColor: '#10b981', color: '#0f172a', padding: '12px 28px', borderRadius: '10px', fontWeight: '800', textDecoration: 'none', fontSize: '16px' }}
              >
                📥 Download Deliverable Files
              </a>
            </div>
          ) : paymentData ? (
            <div>
              <div style={{ backgroundColor: '#0b0f19', padding: '18px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b', fontSize: '14px' }}>
                  💡 Payment Instructions:
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.7' }}>
                  <li>Open TrustWallet, MetaMask, or Binance app.</li>
                  <li>Select <strong>BNB (Binance Smart Chain BEP-20)</strong> as Network.</li>
                  <li>Copy exact amount & deposit address below and send payment.</li>
                  <li>Click <strong>"I Have Paid — Verify Status"</strong> button below to unlock download link!</li>
                </ol>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#94a3b8' }}>Exact BNB Amount:</p>
                  <p style={{ margin: 0, fontSize: '20px', color: '#10b981', fontWeight: '800' }}>
                    {paymentData.pay_amount} BNB
                  </p>
                </div>
                <button 
                  onClick={() => { navigator.clipboard.writeText(paymentData.pay_amount); alert("Amount Copied!"); }}
                  style={{ backgroundColor: '#243045', color: '#38bdf8', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Copy Amount
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Deposit Address (BEP-20):</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={paymentData.pay_address}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                  />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(paymentData.pay_address); alert("Address Copied!"); }}
                    style={{ backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Copy Address
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0', backgroundColor: 'white', padding: '16px', borderRadius: '12px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${paymentData.pay_address}`} 
                  alt="Payment QR" 
                  style={{ width: '150px', height: '150px' }}
                />
              </div>

              <button 
                onClick={verifyNowPaymentStatus}
                disabled={verifyingPayment}
                style={{ width: '100%', backgroundColor: verifyingPayment ? "#ca8a04" : "#10b981", color: "#0f172a", border: "none", padding: "14px", borderRadius: "10px", cursor: "pointer", fontWeight: "800", fontSize: "16px" }}
              >
                {verifyingPayment ? "Checking Blockchain Status..." : "I Have Paid — Verify Status 🚀"}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: MY PURCHASES */}
      {activeTab === "purchases" && (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #243045' }}>
          <h1 style={{ fontSize: '26px', margin: '0 0 10px 0', color: '#f8fafc' }}>📦 Order & Purchase History</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>
            Access all your purchased assets and deliverables anytime.
          </p>

          {purchasedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#0b0f19', borderRadius: '12px' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No purchases found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {purchasedHistory.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #243045', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#f8fafc' }}>{item.title}</h3>
                    <div style={{ display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '13px' }}>
                      <span>Price: <strong style={{ color: '#10b981' }}>${item.price} USD</strong></span>
                      <span>Payment: <strong style={{ color: '#f59e0b' }}>{item.currency}</strong></span>
                      <span>Date: <strong style={{ color: '#cbd5e1' }}>{item.date}</strong></span>
                    </div>
                  </div>

                  <a 
                    href={item.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '10px 18px', borderRadius: '8px', fontWeight: '800', textDecoration: 'none', fontSize: '13px' }}
                  >
                    📥 Download File
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: MY LISTED ASSETS */}
      {activeTab === "my-listings" && user && (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #243045' }}>
          <h1 style={{ fontSize: '26px', margin: '0 0 10px 0', color: '#f8fafc' }}>📋 My Uploaded Assets & Approval Status</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>
            Track your submission status. Approved assets are automatically published to the public marketplace.
          </p>

          {userAssets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#0b0f19', borderRadius: '12px' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>You haven't uploaded any assets yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userAssets.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#0b0f19', border: '1px solid #243045', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>{item.title}</h3>
                      
                      {item.status === 'approved' && (
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                          🟢 Live on Marketplace
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                          🟡 Pending Admin Review
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                          🔴 Rejected
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                      Category: {item.category} | Price: ${item.price} USD
                    </p>
                  </div>

                  <button 
                    onClick={() => handleDeleteAsset(item.id)}
                    style={{ backgroundColor: '#334155', color: '#ef4444', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN PANEL */}
      {activeTab === "admin" && isAdmin && (
        <div style={{ maxWidth: '950px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '24px', margin: 0, color: '#f87171' }}>👑 Admin Approval Dashboard</h1>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>Logged in as Super Admin ({user.email})</p>
            </div>
            <span style={{ backgroundColor: '#991b1b', color: 'white', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              ADMIN ACTIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {allAssetsForAdmin.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No submitted assets found.</p>
            ) : (
              allAssetsForAdmin.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '12px', border: '1px solid #243045', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ maxWidth: '60%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '17px', color: 'white' }}>{item.title}</h4>
                      <span style={{ fontSize: '11px', color: item.status === 'approved' ? '#10b981' : item.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
                        [{item.status ? item.status.toUpperCase() : 'PENDING'}]
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#94a3b8' }}>
                      Seller: <strong style={{ color: '#38bdf8' }}>{item.seller_email || 'N/A'}</strong> | Category: {item.category} | Price: ${item.price} USD
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}>
                      File URL: <a href={item.file_url} target="_blank" rel="noreferrer" style={{ color: '#f59e0b' }}>Inspect File Link ↗</a>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status !== 'approved' && (
                      <button 
                        onClick={() => handleUpdateStatus(item.id, 'approved')}
                        style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
                      >
                        ✅ Approve & Publish
                      </button>
                    )}
                    {item.status !== 'rejected' && (
                      <button 
                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                        style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
                      >
                        ❌ Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteAsset(item.id)}
                      style={{ backgroundColor: '#334155', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DIRECT PASSWORD LOGIN (NO MAGIC LINKS) */}
      {activeTab === "login" && (
        <div style={{ maxWidth: "450px", margin: "0 auto", backgroundColor: "#161e2e", padding: "32px", borderRadius: "20px", border: "1px solid #243045", textAlign: "center" }}>
          <h2 style={{ marginTop: 0, color: '#f8fafc' }}>Direct Login 🔑</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Enter your credentials to access your dashboard.</p>
          
          <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input 
              type="email" 
              required 
              placeholder="Email (e.g. mahmoodoffice9@gmail.com)" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box", outline: 'none' }}
            />
            <input 
              type="password" 
              required 
              placeholder="Enter Password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box", outline: 'none' }}
            />
            <button 
              type="submit" 
              style={{ backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "12px", borderRadius: "10px", fontWeight: "800", cursor: "pointer", fontSize: "16px" }}
            >
              Login Now 🚀
            </button>
          </form>

          {authMsg && <p style={{ marginTop: "15px", fontSize: "14px", color: authMsg.includes("✅") ? "#10b981" : "#f87171" }}>{authMsg}</p>}
        </div>
      )}

      {/* TAB 5: UPLOAD */}
      {activeTab === "upload" && (
        <div style={{ maxWidth: "650px", margin: "0 auto", backgroundColor: "#161e2e", padding: "32px", borderRadius: "20px", border: "1px solid #243045" }}>
          <h1 style={{ fontSize: "26px", marginTop: "0", marginBottom: "6px", color: "#f8fafc" }}>List Your AI Asset 🚀</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "25px" }}>Sell n8n workflows, AI agents, or Micro-SaaS to buyers worldwide.</p>

          {!user ? (
            <div style={{ textAlign: "center", padding: "30px", backgroundColor: "#0b0f19", borderRadius: "12px" }}>
              <h3 style={{ marginTop: 0, color: "white" }}>🔒 Login Required</h3>
              <p style={{ color: "#94a3b8" }}>Please login first to upload assets for review.</p>
              <button 
                onClick={() => setActiveTab("login")}
                style={{ backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "800", marginTop: "10px" }}
              >
                Login / Sign Up 🔑
              </button>
            </div>
          ) : submitted ? (
            <div style={{ backgroundColor: "#064e3b", padding: "24px", borderRadius: "12px", color: "#34d399", textAlign: "center", border: '1px solid #059669' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>✅ Asset Submitted for Review!</h3>
              <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 20px 0' }}>
                Your asset was sent to Admin (<strong>mahmoodoffice9@gmail.com</strong>). Once approved, it will be published to the marketplace!
              </p>
              <button 
                onClick={() => { setActiveTab("my-listings"); setSubmitted(false); }}
                style={{ backgroundColor: "#10b981", color: "#0f172a", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "800" }}
              >
                Track Status in My Listings 📋
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LinkedIn Outreach Automation n8n Flow"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const selected = e.target.value;
                    setFormData(prev => ({ ...prev, category: selected }));
                  }}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box" }}
                >
                  <option value="n8n Workflow">n8n Workflow</option>
                  <option value="Make.com Flow">Make.com Flow</option>
                  <option value="AI Agent">AI Agent (Python/LangChain)</option>
                  <option value="Micro-SaaS">Micro-SaaS / Codebase</option>
                </select>
              </div>

              <div style={{ backgroundColor: "#0f172a", padding: "18px", borderRadius: "12px", border: "1px solid #38bdf8" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#38bdf8", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  📌 Step-by-Step Guide for {formData.category}:
                </h4>

                {formData.category === "n8n Workflow" && (
                  <ol style={{ margin: 0, paddingLeft: "20px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.7" }}>
                    <li>Open your <strong>n8n Dashboard</strong> and select your workflow.</li>
                    <li>Click top-right menu and choose <strong>"Export JSON"</strong>.</li>
                    <li>Upload this JSON file to <strong>Google Drive</strong> or <strong>GitHub Gist</strong>.</li>
                    <li>Set sharing permission to <strong>"Anyone with the link"</strong> and paste the link below!</li>
                  </ol>
                )}

                {formData.category === "Make.com Flow" && (
                  <ol style={{ margin: 0, paddingLeft: "20px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.7" }}>
                    <li>Open your <strong>Make.com Scenario</strong> editor.</li>
                    <li>Click the 3-dots menu at bottom and click <strong>"Export Blueprint"</strong>.</li>
                    <li>Upload the `.json` file to <strong>Google Drive</strong>.</li>
                    <li>Set file access to <strong>Public</strong> and copy-paste the URL below!</li>
                  </ol>
                )}

                {formData.category === "AI Agent" && (
                  <ol style={{ margin: 0, paddingLeft: "20px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.7" }}>
                    <li>Compress your Python/LangChain source code into a <strong>`.zip` file</strong>.</li>
                    <li>Upload the zip file to <strong>Google Drive / GitHub / Dropbox</strong>.</li>
                    <li>Ensure link is publicly accessible for buyers to download after payment.</li>
                  </ol>
                )}

                {formData.category === "Micro-SaaS" && (
                  <ol style={{ margin: 0, paddingLeft: "20px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.7" }}>
                    <li>Package your full codebase repository into a <strong>`.zip`</strong> archive.</li>
                    <li>Upload to cloud storage (Google Drive / GitHub Releases).</li>
                    <li>Paste the public download link in the field below.</li>
                  </ol>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Price ($ USD)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 39"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Deliverable File Link (Drive / GitHub URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Description</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe key features, requirements, and setup steps..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? "#6b21a8" : "#7c3aed", color: "white", border: "none", padding: "14px", fontSize: "16px", borderRadius: "10px", cursor: "pointer", fontWeight: "800", marginTop: "10px" }}
              >
                {loading ? "Submitting for Review..." : "Submit Asset for Approval 🚀"}
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
}

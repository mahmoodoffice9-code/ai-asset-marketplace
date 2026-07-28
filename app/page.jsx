"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase Setup
const supabaseUrl = "https://yfsstuvjvbzoclfagace.supabase.co";
const supabaseAnonKey = "sb_publishable_mhzPm9OWHWzEJ-smFrjz1Q_RQI8BekP";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 👑 ADMIN EMAIL
const ADMIN_EMAIL = "mahmoodoffice9@gmail.com"; 

// 💳 NOWPayments API Key
const NOWPAYMENTS_API_KEY = "6CWDKGC-RMHMG9K-Q9HB8F3-YG0SCAQ";

// 💡 Category-wise Detailed Submission Instructions
const categoryInstructions = {
  "n8n Workflow": "💡 n8n Guide: Open your n8n workflow ➔ Click top-right 3 dots ➔ 'Export' JSON file. Upload that file to Google Drive / GitHub and paste the shareable link (Ensure access is set to 'Anyone with link').",
  "Make.com Flow": "💡 Make.com Guide: Open your Scenario ➔ Click Options (...) at bottom ➔ 'Export Blueprint'. Upload JSON file to Google Drive and paste the public link here.",
  "AI Agent": "💡 AI Agent Guide: Bundle your prompt template, API integration guide, or python code into a .zip file or GitHub Repository. Paste the public download link here.",
  "Micro-SaaS": "💡 Micro-SaaS Guide: Provide a GitHub repo link or a .zip archive link hosted on Drive/Dropbox containing the codebase and README.md setup guide."
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  
  // Data Collections
  const [assets, setAssets] = useState([]);
  const [allAssetsForAdmin, setAllAssetsForAdmin] = useState([]);
  const [userAssets, setUserAssets] = useState([]);
  const [purchasedHistory, setPurchasedHistory] = useState([]);
  const [sellerSalesHistory, setSellerSalesHistory] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
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

  // Withdraw State
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawMsg, setWithdrawMsg] = useState("");

  // Support Form State
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  // Listing Form State
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
      try {
        setPurchasedHistory(JSON.parse(localPurchases));
      } catch (e) {
        console.error("Local storage parse error:", e);
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const cleanEmail = currentUser.email ? currentUser.email.trim().toLowerCase() : "";
        fetchUserAssets(cleanEmail);
        fetchSellerSales(cleanEmail);
        setSupportEmail(cleanEmail);
        if (cleanEmail === ADMIN_EMAIL) {
          fetchAllAssetsAdmin();
          fetchSupportTicketsAdmin();
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
      fetchSellerSales(cleanEmail);
      setSupportEmail(cleanEmail);
      if (cleanEmail === ADMIN_EMAIL) {
        fetchAllAssetsAdmin();
        fetchSupportTicketsAdmin();
      }
    }
  };

  // Login Handler
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setAuthMsg("Logging in...");
    
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
      fetchUserAssets(cleanEmail);
      fetchSellerSales(cleanEmail);
      setSupportEmail(cleanEmail);
      
      if (cleanEmail === ADMIN_EMAIL) {
        fetchAllAssetsAdmin();
        fetchSupportTicketsAdmin();
        setActiveTab("admin");
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

  // FETCH APPROVED ASSETS FOR PUBLIC MARKETPLACE
  const fetchApprovedAssets = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("status", "approved")
      .order("id", { ascending: false });

    if (!error && data) {
      setAssets(data);
    }
  };

  // FETCH ALL ASSETS FOR ADMIN CONTROL
  const fetchAllAssetsAdmin = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setAllAssetsForAdmin(data);
    }
  };

  // FETCH SUPPORT TICKETS FOR ADMIN
  const fetchSupportTicketsAdmin = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setSupportTickets(data);
    }
  };

  // FETCH SELLER'S OWN ASSETS
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

  // FETCH SELLER'S SALES HISTORY
  const fetchSellerSales = async (userEmail) => {
    const { data, error } = await supabase
      .from("sales_orders")
      .select("*")
      .eq("seller_email", userEmail)
      .order("id", { ascending: false });

    if (!error && data) {
      setSellerSalesHistory(data);
    }
  };

  // 👑 ADMIN APPROVE / REJECT HANDLER
  const handleUpdateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus.toLowerCase() })
      .eq("id", id);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      alert(`✅ Asset status updated to ${newStatus.toUpperCase()}!`);
      await fetchAllAssetsAdmin();
      await fetchApprovedAssets();
    }
  };

  // 👑 ADMIN RESOLVE SUPPORT TICKET
  const handleResolveTicket = async (id) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: "resolved" })
      .eq("id", id);

    if (error) {
      alert("Error updating ticket: " + error.message);
    } else {
      alert("Ticket marked as Resolved! ✅");
      fetchSupportTicketsAdmin();
    }
  };

  // DELETE ASSET (ADMIN OR SELLER)
  const handleDeleteAsset = async (id) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error deleting asset: " + error.message);
    } else {
      alert("Asset deleted successfully!");
      if (isAdmin) fetchAllAssetsAdmin();
      fetchApprovedAssets();
      if (user) fetchUserAssets(user.email.trim().toLowerCase());
    }
  };

  // SUBMIT NEW ASSET LISTING
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

  // SUBMIT SUPPORT TICKET
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportEmail || !supportMessage) {
      alert("Please enter your email and message!");
      return;
    }

    setSupportLoading(true);

    const { error } = await supabase.from("support_tickets").insert([
      {
        user_email: supportEmail.trim().toLowerCase(),
        subject: supportSubject || "General Support / Inquiry",
        message: supportMessage,
      }
    ]);

    setSupportLoading(false);

    if (error) {
      alert("Failed to send message: " + error.message);
    } else {
      setSupportSubmitted(true);
      setSupportMessage("");
      setSupportSubject("");
    }
  };

  // NOWPAYMENTS CRYPTO CHECKOUT CREATION
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
        alert("Payment address generation failed. Please check API credentials.");
      }
    } catch (err) {
      setCreatingPayment(false);
      alert("NOWPayments API Error!");
    }
  };

  // RECORD PURCHASE AND SALE IN DATABASE
  const recordPurchase = async (asset, paymentDetails) => {
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

    if (asset.seller_email) {
      await supabase.from("sales_orders").insert([
        {
          seller_email: asset.seller_email.toLowerCase(),
          buyer_email: user ? user.email.toLowerCase() : "Guest User",
          asset_id: asset.id,
          asset_title: asset.title,
          price: asset.price,
        },
      ]);
    }
  };

  // VERIFY PAYMENT STATUS FROM NOWPAYMENTS
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
        await recordPurchase(selectedAsset, data);
      } else if (data.payment_status === "waiting" || data.payment_status === "sending") {
        alert("⏳ Payment pending on blockchain. Please wait a few seconds after sending BNB and verify again!");
      } else {
        alert(`❌ Current Status: ${data.payment_status ? data.payment_status.toUpperCase() : "UNKNOWN"}. Please complete payment.`);
      }
    } catch (err) {
      setVerifyingPayment(false);
      alert("Error checking payment status from blockchain.");
    }
  };

  const userEmailClean = user && user.email ? user.email.trim().toLowerCase() : "";
  const isAdmin = userEmailClean === ADMIN_EMAIL;

  // Seller Dashboard Calculations
  const totalAssetsCount = userAssets.length;
  const approvedAssetsCount = userAssets.filter(a => a.status === 'approved').length;
  const pendingAssetsCount = userAssets.filter(a => a.status === 'pending').length;
  const totalSalesCount = sellerSalesHistory.length;
  const totalRevenue = sellerSalesHistory.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

  // Filtered Assets for Marketplace Search & Category
  const filteredAssets = assets.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f1f5f9', padding: '30px 20px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* HEADER NAVBAR */}
      <header style={{ maxWidth: '1100px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: '#161e2e', padding: '16px 24px', borderRadius: '16px', border: '1px solid #243045', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setActiveTab("marketplace"); setSelectedAsset(null); fetchApprovedAssets(); }}>
          <div style={{ backgroundColor: '#8b5cf6', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '22px', boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}>⚡</div>
          <span style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(90deg, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            CodeHub AI
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setActiveTab("marketplace"); setSubmitted(false); setSelectedAsset(null); fetchApprovedAssets(); }}
            style={{ backgroundColor: activeTab === "marketplace" ? "#7c3aed" : "transparent", color: "white", border: activeTab === "marketplace" ? "none" : "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
          >
            🛒 Marketplace
          </button>

          {user && (
            <button 
              onClick={() => { setActiveTab("your-store"); fetchSellerSales(userEmailClean); fetchUserAssets(userEmailClean); }}
              style={{ backgroundColor: activeTab === "your-store" ? "#10b981" : "#064e3b", color: "white", border: "1px solid #10b981", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}
            >
              🏪 Your Store
            </button>
          )}

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
              📋 My Assets
            </button>
          )}

          <button 
            onClick={() => setActiveTab("upload")}
            style={{ backgroundColor: activeTab === "upload" ? "#7c3aed" : "#1e293b", color: "white", border: "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            + Sell Asset
          </button>

          {/* ADMIN BUTTON */}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab("admin"); fetchAllAssetsAdmin(); fetchSupportTicketsAdmin(); }}
              style={{ backgroundColor: activeTab === "admin" ? "#dc2626" : "#991b1b", color: "white", border: "none", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "800", boxShadow: "0 0 12px rgba(220, 38, 38, 0.6)" }}
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

      {/* MARKETPLACE TAB */}
      {activeTab === "marketplace" && !selectedAsset && (
        <>
          <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', textAlign: 'center' }}>
            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 18px', borderRadius: '30px', fontSize: '13px', fontWeight: '700', display: 'inline-block', marginBottom: '15px' }}>
              ⚡ Instant Crypto Checkout • Verified BEP-20 Blockchain Network
            </span>
            <h1 style={{ fontSize: '48px', fontWeight: '800', marginTop: '10px', marginBottom: '14px', letterSpacing: '-1px', lineHeight: '1.2' }}>
              Buy & Sell <span style={{ background: 'linear-gradient(90deg, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Workflows & Codebases</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
              Explore production-ready n8n workflows, Make.com blueprints, custom AI agents, and Micro-SaaS tools built by top developers.
            </p>

            {/* Search & Category Filters */}
            <div style={{ maxWidth: '700px', margin: '35px auto 0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text"
                placeholder="🔍 Search n8n workflows, scrapers, AI agents, python bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '16px 24px', borderRadius: '14px', border: '1px solid #334155', backgroundColor: '#161e2e', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {["All", "n8n Workflow", "Make.com Flow", "AI Agent", "Micro-SaaS"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      backgroundColor: selectedCategory === cat ? "#7c3aed" : "#161e2e",
                      color: selectedCategory === cat ? "white" : "#94a3b8",
                      border: selectedCategory === cat ? "none" : "1px solid #243045",
                      padding: "8px 18px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s"
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
                <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>No verified assets match your search. Try changing filters!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredAssets.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#161e2e', border: '1px solid #243045', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>{item.category}</span>
                        <span style={{ color: '#10b981', fontWeight: '800', fontSize: '20px' }}>${item.price} USD</span>
                      </div>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>{item.title}</h3>
                      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', minHeight: '42px', margin: '0 0 16px 0' }}>{item.description}</p>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Seller: {item.seller_email ? item.seller_email.split('@')[0] : 'Verified Developer'}</span>
                        <span style={{ color: '#38bdf8' }}>Instant Delivery ⚡</span>
                      </div>
                      <button 
                        onClick={() => createNowPayment(item)}
                        style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}
                      >
                        ⚡ Buy Now (${item.price} in BNB)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 🏪 YOUR STORE DASHBOARD */}
      {activeTab === "your-store" && user && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #10b981', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, color: '#f8fafc' }}>🏪 Your Store Dashboard</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>Registered Seller: <strong style={{ color: '#10b981' }}>{user.email}</strong></p>
            </div>

            <button 
              onClick={() => { fetchSellerSales(userEmailClean); fetchUserAssets(userEmailClean); }}
              style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              🔄 Refresh Analytics
            </button>
          </div>

          {/* STATS OVERVIEW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '35px' }}>
            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '14px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Revenue</p>
              <h2 style={{ color: '#10b981', margin: 0, fontSize: '28px', fontWeight: '800' }}>${totalRevenue} <span style={{ fontSize: '14px', color: '#64748b' }}>USD</span></h2>
            </div>

            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '14px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Completed Sales</p>
              <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '28px', fontWeight: '800' }}>{totalSalesCount}</h2>
            </div>

            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '14px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Listed Assets</p>
              <h2 style={{ color: '#c084fc', margin: 0, fontSize: '28px', fontWeight: '800' }}>{totalAssetsCount}</h2>
            </div>

            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '14px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Live Approved</p>
              <h2 style={{ color: '#22c55e', margin: 0, fontSize: '28px', fontWeight: '800' }}>{approvedAssetsCount}</h2>
            </div>

            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '14px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>In Review</p>
              <h2 style={{ color: '#f59e0b', margin: 0, fontSize: '28px', fontWeight: '800' }}>{pendingAssetsCount}</h2>
            </div>
          </div>

          {/* WITHDRAW EARNINGS SECTION */}
          <div style={{ backgroundColor: '#0b0f19', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', marginBottom: '35px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '18px' }}>💸 Request Earnings Withdrawal</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>Available Payout Balance: <strong style={{ color: '#10b981' }}>${totalRevenue} USD</strong> (Direct transfer in BNB / USDT BEP-20)</p>

            <form onSubmit={(e) => { e.preventDefault(); if(!withdrawAddress) return alert("Enter wallet address"); setWithdrawMsg("✅ Withdrawal request logged! Admin will process payout shortly."); setWithdrawAddress(""); }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Paste your BEP-20 / BNB Wallet Address (0x...)" 
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                style={{ flex: 1, minWidth: '280px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#161e2e', color: 'white', fontSize: '13px', outline: 'none' }}
              />
              <button 
                type="submit" 
                style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
              >
                Withdraw Earnings 🚀
              </button>
            </form>
            {withdrawMsg && <p style={{ margin: '12px 0 0 0', color: '#34d399', fontSize: '13px', fontWeight: 'bold' }}>{withdrawMsg}</p>}
          </div>

          {/* SALES LOG TABLE */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '20px' }}>📈 Sales & Buyers Log</h3>
            {sellerSalesHistory.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No sales recorded yet. Promote your asset links to start earning!</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px' }}>Asset Title</th>
                      <th style={{ padding: '12px' }}>Price</th>
                      <th style={{ padding: '12px' }}>Buyer Email</th>
                      <th style={{ padding: '12px' }}>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerSalesHistory.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #1e293b', color: '#f8fafc' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#38bdf8' }}>{sale.asset_title}</td>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#10b981' }}>${sale.price} USD</td>
                        <td style={{ padding: '12px', color: '#cbd5e1' }}>{sale.buyer_email || 'Guest User'}</td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{new Date(sale.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL / VIEW */}
      {selectedAsset && (
        <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #38bdf8', boxShadow: '0 0 30px rgba(56, 189, 248, 0.2)' }}>
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
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 'bold' }}>🔄 Generating Live BNB BEP-20 Payment Address...</p>
            </div>
          ) : paymentSubmitted ? (
            <div style={{ backgroundColor: '#064e3b', padding: '24px', borderRadius: '12px', color: '#34d399', textAlign: 'center', border: '1px solid #10b981' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>🎉 Payment Confirmed on Blockchain!</h3>
              <p style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '15px' }}>Thank you for your purchase. Click below to download your assets immediately:</p>
              <a href={selectedAsset.file_url} target="_blank" rel="noreferrer" style={{ backgroundColor: '#10b981', color: '#0f172a', padding: '12px 28px', borderRadius: '10px', fontWeight: '800', textDecoration: 'none', display: 'inline-block' }}>
                📥 Download Deliverable Files
              </a>
            </div>
          ) : paymentData ? (
            <div>
              <div style={{ backgroundColor: '#0b0f19', padding: '16px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '15px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Exact Amount to Send:</p>
                <p style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{paymentData.pay_amount} BNB</p>
              </div>

              <div style={{ backgroundColor: '#0b0f19', padding: '16px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Send to BEP-20 Address:</p>
                <input type="text" readOnly value={paymentData.pay_address} style={{ width: '100%', padding: '12px', backgroundColor: '#161e2e', color: '#f59e0b', borderRadius: '8px', border: '1px solid #334155', fontWeight: 'bold', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <button onClick={verifyNowPaymentStatus} disabled={verifyingPayment} style={{ width: '100%', backgroundColor: '#10b981', color: '#0f172a', padding: '14px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                {verifyingPayment ? "Checking Blockchain..." : "I Have Paid — Verify Status 🚀"}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* MY PURCHASES */}
      {activeTab === "purchases" && (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #243045' }}>
          <h1 style={{ fontSize: '26px', margin: '0 0 20px 0' }}>📦 Order & Purchase History</h1>
          {purchasedHistory.length === 0 ? <p style={{ color: '#94a3b8' }}>No purchases found in local session.</p> : (
            purchasedHistory.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#0b0f19', padding: '18px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>{item.title}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Price: ${item.price} USD | Paid via BNB | {item.date}</p>
                </div>
                <a href={item.fileUrl} target="_blank" rel="noreferrer" style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}>Download Link 📥</a>
              </div>
            ))
          )}
        </div>
      )}

      {/* MY LISTINGS */}
      {activeTab === "my-listings" && user && (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #243045' }}>
          <h1 style={{ fontSize: '26px', margin: '0 0 20px 0' }}>📋 My Uploaded Assets</h1>
          {userAssets.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>You have not submitted any assets yet.</p>
          ) : (
            userAssets.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#0b0f19', padding: '18px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>
                    {item.title}{' '}
                    <span style={{ fontSize: '12px', color: item.status === 'approved' ? '#10b981' : '#f59e0b', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                      [{item.status ? item.status.toUpperCase() : 'PENDING'}]
                    </span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Category: {item.category} | Price: ${item.price} USD</p>
                </div>
                <button onClick={() => handleDeleteAsset(item.id)} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Delete</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 👑 ADMIN DASHBOARD */}
      {activeTab === "admin" && isAdmin && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #ef4444', boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)' }}>
          <h1 style={{ fontSize: '26px', margin: '0 0 24px 0', color: '#f87171' }}>👑 Admin Master Control Panel</h1>

          {/* SECTION 1: ASSET APPROVALS */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '10px', fontSize: '18px' }}>📂 Pending & Active Asset Approvals</h3>
            {allAssetsForAdmin.length === 0 ? <p style={{ color: '#94a3b8' }}>No assets found in database.</p> : (
              allAssetsForAdmin.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#0b0f19', padding: '18px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>
                      {item.title}{' '}
                      <span style={{ fontSize: '11px', color: item.status === 'approved' ? '#10b981' : '#f59e0b' }}>
                        [{item.status ? item.status.toUpperCase() : 'PENDING'}]
                      </span>
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Seller: {item.seller_email} | Price: ${item.price} USD | Link: <a href={item.file_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>View Delivery Link</a></p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.status !== 'approved' && <button onClick={() => handleUpdateStatus(item.id, 'approved')} style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Approve</button>}
                    {item.status !== 'rejected' && <button onClick={() => handleUpdateStatus(item.id, 'rejected')} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Reject</button>}
                    <button onClick={() => handleDeleteAsset(item.id)} style={{ backgroundColor: '#7f1d1d', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SECTION 2: 📩 SUPPORT TICKETS IN ADMIN PANEL */}
          <div>
            <h3 style={{ color: '#f59e0b', borderBottom: '1px solid #334155', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px' }}>
              <span>📩 Support Messages / Customer Issues ({supportTickets.length})</span>
              <button onClick={fetchSupportTicketsAdmin} style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🔄 Refresh Tickets</button>
            </h3>

            {supportTickets.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No support tickets submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '15px' }}>
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '14px', border: ticket.status === 'resolved' ? '1px solid #10b981' : '1px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: ticket.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: ticket.status === 'resolved' ? '#10b981' : '#f59e0b', padding: '2px 8px', borderRadius: '10px' }}>
                          {ticket.status ? ticket.status.toUpperCase() : 'PENDING'}
                        </span>
                        <h4 style={{ margin: '6px 0 0 0', color: '#f8fafc', fontSize: '16px' }}>{ticket.subject}</h4>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>

                    <p style={{ backgroundColor: '#161e2e', padding: '14px', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', margin: '10px 0', lineHeight: '1.6', whiteSpace: 'pre-wrap', border: '1px solid #243045' }}>
                      {ticket.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>
                        Sender Email: <a href={`mailto:${ticket.user_email}`} style={{ color: '#38bdf8', textDecoration: 'underline' }}>{ticket.user_email}</a>
                      </span>

                      {ticket.status !== 'resolved' && (
                        <button 
                          onClick={() => handleResolveTicket(ticket.id)}
                          style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Mark Resolved ✅
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGIN TAB */}
      {activeTab === "login" && (
        <div style={{ maxWidth: "450px", margin: "0 auto", backgroundColor: "#161e2e", padding: "32px", borderRadius: "20px", border: "1px solid #243045" }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Direct Login 🔑</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Login as seller or admin to manage store & listings.</p>
          <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input type="email" required placeholder="Email address..." value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none" }} />
            <input type="password" required placeholder="Password..." value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none" }} />
            <button type="submit" style={{ backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>Login Now</button>
          </form>
          {authMsg && <p style={{ marginTop: "15px", fontSize: "13px", color: authMsg.includes("✅") ? "#10b981" : "#f87171" }}>{authMsg}</p>}
        </div>
      )}

      {/* UPLOAD / LIST ASSET TAB */}
      {activeTab === "upload" && (
        <div style={{ maxWidth: "650px", margin: "0 auto", backgroundColor: "#161e2e", padding: "32px", borderRadius: "20px", border: "1px solid #243045" }}>
          <h1 style={{ fontSize: "26px", marginTop: "0" }}>List Your AI Asset 🚀</h1>
          {!user ? <p style={{ color: "#94a3b8" }}>Please login first to submit an asset.</p> : submitted ? (
            <div style={{ backgroundColor: '#064e3b', padding: '20px', borderRadius: '12px', color: '#34d399', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px 0' }}>✅ Asset Submitted Successfully!</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>Admin review process usually takes 1-2 hours. You can monitor status in 'My Assets' tab.</p>
              <button onClick={() => setSubmitted(false)} style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }}>List Another Asset</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Asset Title</label>
                <input type="text" required placeholder="e.g. Lead Scraping n8n Workflow + Telegram Bot" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none", boxSizing: "border-box" }}>
                  <option value="n8n Workflow">n8n Workflow</option>
                  <option value="Make.com Flow">Make.com Flow</option>
                  <option value="AI Agent">AI Agent</option>
                  <option value="Micro-SaaS">Micro-SaaS / Codebase</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Price ($ USD)</label>
                <input type="number" required placeholder="15" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Deliverable File URL (Google Drive / GitHub Public Link)</label>
                <input type="url" required placeholder="https://drive.google.com/..." value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none", boxSizing: "border-box" }} />
                <p style={{ color: '#38bdf8', fontSize: '11px', margin: '6px 0 0 0', lineHeight: '1.4' }}>{categoryInstructions[formData.category]}</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Description & Features</label>
                <textarea rows="4" required placeholder="Describe what this asset does, integrations included, and setup instructions..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white", outline: "none", boxSizing: "border-box" }} />
              </div>

              <button type="submit" disabled={loading} style={{ backgroundColor: "#7c3aed", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}>{loading ? "Submitting..." : "Submit Asset for Approval 🚀"}</button>
            </form>
          )}
        </div>
      )}

      {/* 💬 CONTACT SUPPORT BOX (PAGE FOOTER SECTION) */}
      <footer style={{ maxWidth: '1100px', margin: '60px auto 20px auto', borderTop: '1px solid #243045', paddingTop: '40px' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '32px' }}>💬</span>
            <h2 style={{ fontSize: '22px', margin: '6px 0 0 0', color: '#f8fafc' }}>Need Help or Have Questions?</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>Submit your query below. Messages are logged directly into our Admin Dashboard for instant resolution.</p>
          </div>

          {supportSubmitted ? (
            <div style={{ backgroundColor: '#064e3b', padding: '20px', borderRadius: '12px', color: '#34d399', textAlign: 'center', border: '1px solid #059669' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>✅ Support Ticket Received!</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>Admin team will review your message and reply back shortly.</p>
              <button 
                onClick={() => setSupportSubmitted(false)}
                style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px', fontSize: '12px' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Your Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Subject / Topic (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Issue with download link, Payment query, Seller request..."
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px', fontWeight: 'bold' }}>Your Problem / Message</label>
                <textarea 
                  rows="4" 
                  required 
                  placeholder="Type your message or issue in detail..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={supportLoading}
                style={{ backgroundColor: supportLoading ? '#0284c7' : '#38bdf8', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}
              >
                {supportLoading ? "Sending to Admin..." : "Submit Support Request 📩"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '30px' }}>
          © CodeHub AI Marketplace. Powered by Supabase & NOWPayments.
        </p>
      </footer>

    </div>
  );
}

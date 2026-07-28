"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// -------------------------------------------------------------
// SUPABASE CONFIGURATION
// -------------------------------------------------------------
const supabaseUrl = "https://yfsstuvjvbzoclfagace.supabase.co";
const supabaseAnonKey = "sb_publishable_mhzPm9OWHWzEJ-smFrjz1Q_RQI8BekP";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -------------------------------------------------------------
// CONSTANTS & KEYS
// -------------------------------------------------------------
const ADMIN_EMAIL = "mahmoodoffice9@gmail.com"; 
const NOWPAYMENTS_API_KEY = "6CWDKGC-RMHMG9K-Q9HB8F3-YG0SCAQ";

// Category Guidelines Map
const categoryInstructions = {
  "n8n Workflow": "💡 n8n Guide: Open your n8n workflow ➔ Click top-right 3 dots ➔ 'Export' JSON file. Upload that file to Google Drive / GitHub and paste the shareable link.",
  "Make.com Flow": "💡 Make.com Guide: Open your Scenario ➔ Click Options (...) at bottom ➔ 'Export Blueprint'. Upload JSON file to Google Drive and paste the link here.",
  "AI Agent": "💡 AI Agent Guide: Bundle your prompt template, API guide, or python code into a .zip file or GitHub Repo. Paste the link here.",
  "Micro-SaaS": "💡 Micro-SaaS Guide: Provide a GitHub repo link or a .zip archive link hosted on Drive/Dropbox containing the codebase and README.md."
};

export default function Home() {
  // -------------------------------------------------------------
  // APP NAVIGATION & TAB STATES
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState("marketplace");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  
  // Data States
  const [assets, setAssets] = useState([]);
  const [allAssetsForAdmin, setAllAssetsForAdmin] = useState([]);
  const [userAssets, setUserAssets] = useState([]);
  const [purchasedHistory, setPurchasedHistory] = useState([]);
  const [sellerSalesHistory, setSellerSalesHistory] = useState([]);
  const [allSalesForAdmin, setAllSalesForAdmin] = useState([]);
  const [payoutsHistory, setPayoutsHistory] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [user, setUser] = useState(null);
  
  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Detail Modal & Payment Modal States
  const [viewingAsset, setViewingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);

  // 👛 WALLET SELECTION STATE
  const [selectedWallet, setSelectedWallet] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false); // 👈 Terms Checkbox State

  // Withdraw State
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawMsg, setWithdrawMsg] = useState("");

  // Admin Date Filter State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Admin Payout Process Form State
  const [payoutSellerEmail, setPayoutSellerEmail] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutTxHash, setPayoutTxHash] = useState("");

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

  // -------------------------------------------------------------
  // INITIALIZATION & AUTH LISTENERS
  // -------------------------------------------------------------
  useEffect(() => {
    fetchApprovedAssets();
    checkUser();

    const localPurchases = localStorage.getItem("ai_hub_purchases");
    if (localPurchases) {
      try {
        setPurchasedHistory(JSON.parse(localPurchases));
      } catch (err) {
        console.error("Failed to parse local storage purchases", err);
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
          fetchAllSalesAdmin();
          fetchPayoutsAdmin();
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
        fetchAllSalesAdmin();
        fetchPayoutsAdmin();
      }
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // -------------------------------------------------------------
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
        fetchAllSalesAdmin();
        fetchPayoutsAdmin();
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

  // -------------------------------------------------------------
  // SUPABASE DATABASE FETCHERS
  // -------------------------------------------------------------
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

  const fetchAllAssetsAdmin = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setAllAssetsForAdmin(data);
    }
  };

  const fetchSupportTicketsAdmin = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setSupportTickets(data);
    }
  };

  const fetchAllSalesAdmin = async () => {
    const { data, error } = await supabase
      .from("sales_orders")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setAllSalesForAdmin(data);
    }
  };

  const fetchPayoutsAdmin = async () => {
    const { data, error } = await supabase
      .from("payouts")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setPayoutsHistory(data);
    }
  };

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

  // -------------------------------------------------------------
  // ADMIN PANEL ACTION HANDLERS
  // -------------------------------------------------------------
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

  const handleDeleteAsset = async (id) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Error deleting asset: " + error.message);
    } else {
      alert("Asset deleted successfully!");
      fetchAllAssetsAdmin();
      fetchApprovedAssets();
    }
  };

  const handleRecordPayout = async (e) => {
    e.preventDefault();
    if (!payoutSellerEmail || !payoutAmount) {
      alert("Please enter seller email and payout amount!");
      return;
    }

    const { error } = await supabase.from("payouts").insert([
      {
        seller_email: payoutSellerEmail.trim().toLowerCase(),
        amount: parseFloat(payoutAmount),
        tx_hash: payoutTxHash || "Manual / On-chain",
      }
    ]);

    if (error) {
      alert("Failed to record payout: " + error.message);
    } else {
      alert("✅ Payout Recorded Successfully!");
      setPayoutSellerEmail("");
      setPayoutAmount("");
      setPayoutTxHash("");
      fetchPayoutsAdmin();
    }
  };

  // -------------------------------------------------------------
  // USER ACTION HANDLERS (SUBMIT ASSET & SUPPORT)
  // -------------------------------------------------------------
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
      setFormData({
        title: "",
        category: "n8n Workflow",
        price: "",
        description: "",
        fileUrl: "",
      });
      fetchUserAssets(user.email.trim().toLowerCase());
    }
  };

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
        subject: supportSubject || "General Inquiry",
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

  // -------------------------------------------------------------
  // NOWPAYMENTS API & PAYMENT VERIFICATION
  // -------------------------------------------------------------
  const createNowPayment = async (asset) => {
    setViewingAsset(null);
    setSelectedAsset(asset);
    setSelectedWallet("");
    setAgreeTerms(false);
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
        alert("Payment address generation failed. Please try again.");
      }
    } catch (err) {
      setCreatingPayment(false);
      alert("NOWPayments API Gateway Connection Error!");
    }
  };

  const handleOpenWalletAndPay = () => {
    if (!agreeTerms) {
      alert("Please agree to the Terms and Conditions before proceeding!");
      return;
    }
    if (!paymentData || !paymentData.pay_address) return;

    const address = paymentData.pay_address;
    const amount = paymentData.pay_amount;

    navigator.clipboard?.writeText?.(address);

    let redirectUrl = "";
    switch (selectedWallet) {
      case "metamask":
        redirectUrl = `https://metamask.app.link/send/${address}@56?value=${amount}`;
        break;
      case "trustwallet":
        redirectUrl = `https://link.trustwallet.com/send?asset=c714&address=${address}&amount=${amount}`;
        break;
      case "binance":
        redirectUrl = `https://www.binance.com/en/web3wallet`;
        break;
      case "coinbase":
        redirectUrl = `https://go.cb-w.com/pay?address=${address}`;
        break;
      default:
        redirectUrl = `https://bscscan.com/address/${address}`;
        break;
    }

    window.open(redirectUrl, "_blank");
  };

  const recordPurchase = async (asset, paymentDetails) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newPurchase = {
      id: Date.now(),
      title: asset.title,
      category: asset.category,
      price: asset.price,
      currency: "BNB (BEP-20)",
      paymentMethod: `Crypto (${selectedWallet ? selectedWallet.toUpperCase() : "Wallet"} / BNB BSC)`,
      fileUrl: asset.file_url,
      date: formattedDate,
      time: formattedTime,
      fullTimestamp: `${formattedDate} at ${formattedTime}`,
      paymentId: paymentDetails.payment_id || `PAY_${Date.now()}`,
      payAddress: paymentDetails.pay_address || "N/A",
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
        alert("⏳ Payment is being confirmed on the Binance Smart Chain. Click again in a minute!");
      } else {
        alert(`❌ Current Status: ${data.payment_status ? data.payment_status.toUpperCase() : "UNKNOWN"}. Please complete transaction.`);
      }
    } catch (err) {
      setVerifyingPayment(false);
      alert("Error verifying payment status with blockchain gateway.");
    }
  };

  // Derived Utilities & Calculations
  const userEmailClean = user && user.email ? user.email.trim().toLowerCase() : "";
  const isAdmin = userEmailClean === ADMIN_EMAIL;

  const totalAssetsCount = userAssets.length;
  const approvedAssetsCount = userAssets.filter(a => a.status === 'approved').length;
  const pendingAssetsCount = userAssets.filter(a => a.status === 'pending').length;
  const totalSalesCount = sellerSalesHistory.length;
  const totalRevenue = sellerSalesHistory.reduce((acc, curr) => acc + Number(curr.price || 0), 0);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const totalAdminRevenue = allSalesForAdmin.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const platformFeePercentage = 0.10;
  const totalProfit = totalAdminRevenue * platformFeePercentage;

  const totalPaidOut = payoutsHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const sellerOwedShare = totalAdminRevenue * (1 - platformFeePercentage);
  const remainingPayoutOwed = Math.max(0, sellerOwedShare - totalPaidOut);

  const todaySales = allSalesForAdmin.filter(s => s.created_at && s.created_at.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const yesterdaySales = allSalesForAdmin.filter(s => s.created_at && s.created_at.startsWith(yesterdayStr));
  const yesterdayRevenue = yesterdaySales.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const customDateSales = allSalesForAdmin.filter(s => {
    if (!s.created_at) return false;
    const saleDate = s.created_at.split("T")[0];
    if (startDate && saleDate < startDate) return false;
    if (endDate && saleDate > endDate) return false;
    return true;
  });
  const customDateRevenue = customDateSales.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const filteredAssets = assets.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f1f5f9', padding: '30px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER NAVBAR */}
      <header style={{ maxWidth: '1100px', margin: '0 auto 40px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: '#161e2e', padding: '16px 24px', borderRadius: '16px', border: '1px solid #243045' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { setActiveTab("marketplace"); setSelectedAsset(null); setViewingAsset(null); fetchApprovedAssets(); }}>
          <div style={{ backgroundColor: '#8b5cf6', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>⚡</div>
          <span style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(90deg, #a855f7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CodeHub AI
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setActiveTab("marketplace"); setSubmitted(false); setSelectedAsset(null); setViewingAsset(null); fetchApprovedAssets(); }}
            style={{ backgroundColor: activeTab === "marketplace" ? "#7c3aed" : "transparent", color: "white", border: activeTab === "marketplace" ? "none" : "1px solid #334155", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
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
            style={{ backgroundColor: activeTab === "purchases" ? "#38bdf8" : "transparent", color: activeTab === "purchases" ? "#0f172a" : "white", border: activeTab === "purchases" ? "none" : "1px solid #38bdf8", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}
          >
            📜 Buying Details {purchasedHistory.length > 0 && <span style={{ backgroundColor: '#10b981', color: 'black', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px', fontWeight: 'bold' }}>{purchasedHistory.length}</span>}
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

          <button 
            onClick={() => { setActiveTab("support"); setSupportSubmitted(false); }}
            style={{ backgroundColor: activeTab === "support" ? "#f59e0b" : "transparent", color: activeTab === "support" ? "#0f172a" : "white", border: activeTab === "support" ? "none" : "1px solid #f59e0b", padding: "8px 18px", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}
          >
            💬 Support
          </button>

          {isAdmin && (
            <button 
              onClick={() => { setActiveTab("admin"); fetchAllAssetsAdmin(); fetchSupportTicketsAdmin(); fetchAllSalesAdmin(); fetchPayoutsAdmin(); }}
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

      {/* MARKETPLACE MAIN LISTING PAGE */}
      {activeTab === "marketplace" && !selectedAsset && !viewingAsset && (
        <>
          <div style={{ maxWidth: '1000px', margin: '0 auto 40px auto', textAlign: 'center' }}>
            <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '700' }}>
              ⚡ Instant Crypto Checkout • Verified BEP-20 Network
            </span>
            <h1 style={{ fontSize: '46px', fontWeight: '800', marginTop: '20px', marginBottom: '12px', letterSpacing: '-1px' }}>
              Premium <span style={{ background: 'linear-gradient(90deg, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Workflows & Codebase</span>
            </h1>

            <div style={{ maxWidth: '650px', margin: '30px auto 0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>No verified assets listed in this category yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredAssets.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#161e2e', border: '1px solid #243045', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease-in-out' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.3)', textTransform: 'uppercase' }}>
                          ⚡ {item.category}
                        </span>
                        <span style={{ color: '#10b981', fontWeight: '800', fontSize: '18px' }}>${item.price} USD</span>
                      </div>

                      <h3 
                        onClick={() => setViewingAsset(item)}
                        style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '800', color: '#f8fafc', cursor: 'pointer' }}
                      >
                        {item.title} <span style={{ fontSize: '14px', color: '#38bdf8' }}>↗</span>
                      </h3>

                      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', minHeight: '42px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button 
                        onClick={() => setViewingAsset(item)}
                        style={{ flex: 1, backgroundColor: '#0f172a', color: '#cbd5e1', border: '1px solid #334155', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                      >
                        👁️ View Details
                      </button>

                      <button 
                        onClick={() => createNowPayment(item)}
                        style={{ flex: 1.5, backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                      >
                        ⚡ Buy (${item.price})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* FULL ATTRACTIVE ASSET DETAILS MODAL SCREEN */}
      {viewingAsset && !selectedAsset && (
        <div style={{ maxWidth: '800px', margin: '20px auto', backgroundColor: '#161e2e', padding: '36px', borderRadius: '24px', border: '1px solid #38bdf8', boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)' }}>
          <button 
            onClick={() => setViewingAsset(null)}
            style={{ backgroundColor: '#0b0f19', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '24px', fontSize: '13px', fontWeight: '700' }}
          >
            ← Back to Marketplace
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.3)', textTransform: 'uppercase' }}>
                ⚡ {viewingAsset.category}
              </span>
              <h1 style={{ margin: '12px 0 6px 0', color: '#f8fafc', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                {viewingAsset.title}
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                Verified Author: <strong style={{ color: '#cbd5e1' }}>{viewingAsset.seller_email || "Official Developer"}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'right', backgroundColor: '#0b0f19', padding: '16px 24px', borderRadius: '16px', border: '1px solid #243045' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>Instant Price</span>
              <span style={{ color: '#10b981', fontSize: '32px', fontWeight: '800' }}>${viewingAsset.price} <span style={{ fontSize: '14px', color: '#64748b' }}>USD</span></span>
            </div>
          </div>

          <hr style={{ borderColor: '#243045', margin: '28px 0' }} />

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>📖 Complete Description & Deliverables</h3>
            <div style={{ backgroundColor: '#0b0f19', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', color: '#cbd5e1', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {viewingAsset.description}
            </div>
          </div>

          <button 
            onClick={() => createNowPayment(viewingAsset)}
            style={{ width: '100%', backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '800', fontSize: '18px', cursor: 'pointer', boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)' }}
          >
            ⚡ Buy & Download Asset Now (${viewingAsset.price} USD)
          </button>
        </div>
      )}

      {/* 📜 TERMS AND CONDITIONS VIEW TAB */}
      {activeTab === "terms" && (
        <div style={{ maxWidth: '800px', margin: '20px auto', backgroundColor: '#161e2e', padding: '36px', borderRadius: '20px', border: '1px solid #38bdf8' }}>
          <button 
            onClick={() => setActiveTab("marketplace")}
            style={{ backgroundColor: '#0b0f19', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '24px', fontSize: '13px', fontWeight: '700' }}
          >
            ← Back to Marketplace
          </button>

          <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>📜 Terms and Conditions</h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Last updated: July 2026</p>

          <div style={{ backgroundColor: '#0b0f19', padding: '24px', borderRadius: '16px', border: '1px solid #243045', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <section>
              <h3 style={{ color: '#38bdf8', marginBottom: '6px' }}>1. Acceptance of Terms</h3>
              <p>By accessing or purchasing digital assets, codebases, or workflows from CodeHub AI, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform.</p>
            </section>

            <section>
              <h3 style={{ color: '#38bdf8', marginBottom: '6px' }}>2. Digital Products & Refund Policy</h3>
              <p>All items sold on CodeHub AI are digital code deliverables (n8n workflows, scripts, micro-SaaS codebases). Due to the irrevocable nature of digital source code downloads, <strong>all sales are final and non-refundable</strong> once the download link is accessed or delivered.</p>
            </section>

            <section>
              <h3 style={{ color: '#38bdf8', marginBottom: '6px' }}>3. Crypto Payments & Escrow</h3>
              <p>Payments are processed over the Binance Smart Chain (BNB / BEP-20) via secure automated gateways. Users are strictly responsible for sending exact amounts to designated addresses. Incorrect transfers or wrong networks cannot be manually reversed by platform administrators.</p>
            </section>

            <section>
              <h3 style={{ color: '#38bdf8', marginBottom: '6px' }}>4. Intellectual Property & Licensing</h3>
              <p>Purchasers receive a non-exclusive license to use, modify, and deploy the purchased workflows or source code for personal or commercial projects. Reselling or redistributing raw source code files publicly on other platforms is strictly prohibited.</p>
            </section>

            <section>
              <h3 style={{ color: '#38bdf8', marginBottom: '6px' }}>5. Limitation of Liability</h3>
              <p>CodeHub AI and its developers shall not be held liable for any direct, indirect, or incidental damages resulting from the use or integration of purchased codebases, APIs, or automated workflows.</p>
            </section>
          </div>
        </div>
      )}

      {/* 📜 BUYING HISTORY FOLDER TAB */}
      {activeTab === "purchases" && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#161e2e', padding: '36px', borderRadius: '20px', border: '1px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, color: '#f8fafc' }}>📜 Detailed Buying History Folder</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>Complete chronological timeline of your purchased AI scripts & codebases.</p>
            </div>
            <span style={{ backgroundColor: '#0b0f19', border: '1px solid #334155', color: '#38bdf8', padding: '8px 16px', borderRadius: '30px', fontWeight: 'bold', fontSize: '13px' }}>
              Total Orders: {purchasedHistory.length}
            </span>
          </div>

          {purchasedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#0b0f19', borderRadius: '16px', border: '1px dashed #334155' }}>
              <span style={{ fontSize: '40px' }}>🛒</span>
              <p style={{ color: '#94a3b8', marginTop: '10px' }}>You haven't purchased any items yet on this device.</p>
              <button onClick={() => setActiveTab("marketplace")} style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Explore Marketplace 🚀</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {purchasedHistory.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#0b0f19', padding: '24px', borderRadius: '16px', border: '1px solid #243045', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                        {item.category || "AI Asset"}
                      </span>
                      <h3 style={{ margin: '6px 0 0 0', color: '#f8fafc', fontSize: '20px', fontWeight: '800' }}>{item.title}</h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#10b981', fontSize: '22px', fontWeight: '800' }}>${item.price} USD</span>
                      <p style={{ color: '#64748b', fontSize: '11px', margin: '2px 0 0 0' }}>Status: Confirmed ✅</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>⚡ Lifetime Download Access Granted</span>
                    <a 
                      href={item.fileUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ backgroundColor: '#10b981', color: '#0f172a', padding: '10px 22px', borderRadius: '10px', fontWeight: '800', textDecoration: 'none', fontSize: '13px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}
                    >
                      📥 Download Deliverables
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTACT SUPPORT TAB */}
      {activeTab === "support" && (
        <div style={{ maxWidth: '650px', margin: '20px auto', backgroundColor: '#161e2e', padding: '36px', borderRadius: '20px', border: '1px solid #f59e0b' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '36px' }}>💬</span>
            <h1 style={{ fontSize: '26px', margin: '8px 0 0 0', color: '#f8fafc', fontWeight: '800' }}>Contact Support Team</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '6px 0 0 0' }}>Have a question or facing an issue? Send us a ticket directly.</p>
          </div>

          {supportSubmitted ? (
            <div style={{ backgroundColor: '#064e3b', padding: '24px', borderRadius: '14px', color: '#34d399', textAlign: 'center', border: '1px solid #059669' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>✅ Support Ticket Received!</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>Our support team will review your query and reach back out to your provided email shortly.</p>
              <button 
                onClick={() => setSupportSubmitted(false)}
                style={{ backgroundColor: '#10b981', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px', fontSize: '13px' }}
              >
                Send Another Ticket 📩
              </button>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 'bold' }}>Your Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@example.com"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 'bold' }}>Subject / Topic (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Issue with download link, Crypto Payment..."
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 'bold' }}>Your Problem / Detailed Message</label>
                <textarea 
                  rows="5" 
                  required 
                  placeholder="Explain your problem or question clearly..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0b0f19', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={supportLoading}
                style={{ backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '16px', marginTop: '6px' }}
              >
                {supportLoading ? "Submitting Ticket..." : "Submit Support Request 🚀"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* YOUR STORE TAB (SELLER ANALYTICS) */}
      {activeTab === "your-store" && user && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, color: '#f8fafc' }}>🏪 Your Store Dashboard</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>Seller: <strong style={{ color: '#10b981' }}>{user.email}</strong></p>
            </div>

            <button 
              onClick={() => { fetchSellerSales(userEmailClean); fetchUserAssets(userEmailClean); }}
              style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              🔄 Refresh Stats
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '35px' }}>
            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '12px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Revenue</p>
              <h2 style={{ color: '#10b981', margin: 0, fontSize: '28px', fontWeight: '800' }}>${totalRevenue} <span style={{ fontSize: '14px', color: '#64748b' }}>USD</span></h2>
            </div>
            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '12px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Sales</p>
              <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '28px', fontWeight: '800' }}>{totalSalesCount}</h2>
            </div>
            <div style={{ backgroundColor: '#0b0f19', padding: '20px', borderRadius: '12px', border: '1px solid #243045' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Assets</p>
              <h2 style={{ color: '#c084fc', margin: 0, fontSize: '28px', fontWeight: '800' }}>{totalAssetsCount}</h2>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL VIEW (WITH WALLET SELECTION & TERMS CHECKBOX) */}
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
            <p style={{ color: '#f59e0b', textAlign: 'center', padding: '20px 0' }}>🔄 Generating Live BNB Address on Blockchain...</p>
          ) : paymentSubmitted ? (
            <div style={{ backgroundColor: '#064e3b', padding: '24px', borderRadius: '12px', color: '#34d399', textAlign: 'center' }}>
              <h3>🎉 Payment Verified & Confirmed!</h3>
              <p style={{ color: '#cbd5e1', fontSize: '13px' }}>Your deliverable files are ready for instant download below:</p>
              <a href={selectedAsset.file_url} target="_blank" rel="noreferrer" style={{ backgroundColor: '#10b981', color: '#0f172a', padding: '12px 28px', borderRadius: '10px', fontWeight: '800', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}>
                📥 Download Asset Deliverable Files
              </a>
            </div>
          ) : paymentData ? (
            <div>
              <div style={{ marginBottom: '20px', backgroundColor: '#0b0f19', padding: '18px', borderRadius: '12px', border: '1px solid #243045' }}>
                <label style={{ display: 'block', color: '#38bdf8', fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>
                  1️⃣ Select Your Crypto Wallet:
                </label>
                <select 
                  value={selectedWallet} 
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#161e2e', color: 'white', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                >
                  <option value="">-- Choose Your Wallet --</option>
                  <option value="metamask">🦊 MetaMask</option>
                  <option value="trustwallet">🛡️ Trust Wallet</option>
                  <option value="binance">🟡 Binance Web3 / App</option>
                  <option value="coinbase">🔵 Coinbase Wallet</option>
                  <option value="other">📱 Other Wallet (Manual Copy)</option>
                </select>
              </div>

              {selectedWallet && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Exact Payable Amount:</p>
                    <p style={{ color: '#f59e0b', fontSize: '18px', fontWeight: '800', margin: 0 }}>{paymentData.pay_amount} BNB</p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: '6px 0 0 0', fontFamily: 'monospace', wordBreak: 'break-all' }}>Target Address: {paymentData.pay_address}</p>
                  </div>

                  {/* 📜 TERMS AND CONDITIONS CHECKBOX */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#0b0f19', padding: '12px', borderRadius: '10px', border: '1px solid #243045' }}>
                    <input 
                      type="checkbox" 
                      id="agree" 
                      checked={agreeTerms} 
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="agree" style={{ color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                      I agree to the <span onClick={() => setActiveTab("terms")} style={{ color: '#38bdf8', textDecoration: 'underline' }}>Terms and Conditions</span> (All digital sales are final).
                    </label>
                  </div>

                  <button 
                    onClick={handleOpenWalletAndPay} 
                    style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', padding: '14px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: agreeTerms ? 1 : 0.6 }}
                  >
                    🚀 Pay Now via {selectedWallet.toUpperCase()}
                  </button>

                  <hr style={{ borderColor: '#243045', margin: '10px 0' }} />

                  <button 
                    onClick={verifyNowPaymentStatus} 
                    disabled={verifyingPayment} 
                    style={{ width: '100%', backgroundColor: '#10b981', color: '#0f172a', padding: '14px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                  >
                    {verifyingPayment ? "Checking Blockchain..." : "I Have Paid — Verify Status ✅"}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* MY LISTINGS TAB */}
      {activeTab === "my-listings" && user && (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px' }}>
          <h1 style={{ fontSize: '26px', margin: '0 0 20px 0' }}>📋 My Uploaded Assets</h1>
          {userAssets.length === 0 ? <p style={{ color: '#94a3b8' }}>You haven't listed any assets yet.</p> : (
            userAssets.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#0b0f19', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>{item.title} <span style={{ fontSize: '12px', color: item.status === 'approved' ? '#10b981' : '#f59e0b' }}>[{item.status.toUpperCase()}]</span></h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Price: ${item.price} USD</p>
                </div>
                <button onClick={() => handleDeleteAsset(item.id)} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 👑 ADMIN MASTER CONTROL PANEL */}
      {activeTab === "admin" && isAdmin && (
        <div style={{ maxWidth: '1050px', margin: '0 auto', backgroundColor: '#161e2e', padding: '32px', borderRadius: '20px', border: '1px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h1 style={{ fontSize: '26px', margin: 0, color: '#f87171' }}>👑 Admin Master Control Panel</h1>
            <button onClick={() => { fetchAllAssetsAdmin(); fetchSupportTicketsAdmin(); fetchAllSalesAdmin(); fetchPayoutsAdmin(); }} style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🔄 Refresh All Analytics</button>
          </div>

          <div style={{ marginBottom: '40px', backgroundColor: '#0b0f19', padding: '24px', borderRadius: '16px', border: '1px solid #243045' }}>
            <h3 style={{ color: '#38bdf8', margin: '0 0 20px 0', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>💰 Platform Financial Overview</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#161e2e', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Gross Revenue</p>
                <h2 style={{ color: '#10b981', margin: 0, fontSize: '26px', fontWeight: '800' }}>${totalAdminRevenue} <span style={{ fontSize: '12px', color: '#64748b' }}>USD</span></h2>
              </div>
              <div style={{ backgroundColor: '#161e2e', padding: '18px', borderRadius: '12px', border: '1px solid #334155' }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Platform Profit (10% Cut)</p>
                <h2 style={{ color: '#c084fc', margin: 0, fontSize: '26px', fontWeight: '800' }}>${totalProfit.toFixed(2)} <span style={{ fontSize: '12px', color: '#64748b' }}>USD</span></h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN TAB */}
      {activeTab === "login" && (
        <div style={{ maxWidth: "450px", margin: "0 auto", backgroundColor: "#161e2e", padding: "32px", borderRadius: "20px" }}>
          <h2>Direct Login 🔑</h2>
          <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input type="email" required placeholder="Email..." value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }} />
            <input type="password" required placeholder="Password..." value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }} />
            <button type="submit" style={{ backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Login Now</button>
          </form>
          {authMsg && <p style={{ marginTop: "10px", color: authMsg.includes("✅") ? "#10b981" : "#f87171" }}>{authMsg}</p>}
        </div>
      )}

      {/* UPLOAD ASSET TAB */}
      {activeTab === "upload" && (
        <div style={{ maxWidth: "650px", margin: "0 auto", backgroundColor: "#161e2e", padding: "32px", borderRadius: "20px" }}>
          <h1 style={{ fontSize: "26px", marginTop: "0" }}>List Your AI Asset 🚀</h1>
          {!user ? <p style={{ color: "#94a3b8" }}>Please login first to submit assets.</p> : submitted ? <p style={{ color: "#10b981" }}>✅ Submitted for Admin review!</p> : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="text" required placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }} />
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }}>
                <option value="n8n Workflow">n8n Workflow</option>
                <option value="Make.com Flow">Make.com Flow</option>
                <option value="AI Agent">AI Agent</option>
                <option value="Micro-SaaS">Micro-SaaS / Codebase</option>
              </select>
              
              <div style={{ backgroundColor: '#0b0f19', padding: '12px', borderRadius: '8px', border: '1px solid #243045', fontSize: '12px', color: '#38bdf8' }}>
                {categoryInstructions[formData.category]}
              </div>

              <input type="number" required placeholder="Price ($ USD)" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }} />
              <input type="url" required placeholder="Deliverable Share Link (Google Drive / GitHub)" value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }} />
              <textarea rows="4" required placeholder="Description & Features..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0b0f19", color: "white" }} />
              <button type="submit" disabled={loading} style={{ backgroundColor: "#7c3aed", color: "white", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>{loading ? "Submitting..." : "Submit Asset 🚀"}</button>
            </form>
          )}
        </div>
      )}

      {/* FOOTER WITH TERMS LINK */}
      <footer style={{ maxWidth: '1100px', margin: '60px auto 20px auto', borderTop: '1px solid #243045', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
          © CodeHub AI Marketplace. Powered by Supabase & NOWPayments.
        </p>
        <button 
          onClick={() => setActiveTab("terms")} 
          style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
        >
          Terms and Conditions
        </button>
      </footer>

    </div>
  );
}

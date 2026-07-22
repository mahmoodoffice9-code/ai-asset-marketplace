export default function Home() {
  const assets = [
    { id: 1, title: "Automated LinkedIn Scraper", type: "n8n Workflow", price: "$29" },
    { id: 2, title: "AI Support Chatbot", type: "AI Agent", price: "$49" },
    { id: 3, title: "SEO Article Generator", type: "Micro-SaaS", price: "$999" }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif' }}>
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
        <button style={{ backgroundColor: '#9333ea', color: 'white', border: 'none', padding: '12px 24px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Explore Marketplace
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
    </div>
  );
}

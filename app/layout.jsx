export const metadata = {
  title: 'AI Asset Marketplace',
  description: 'Buy and Sell AI Workflows, Agents, and Micro-SaaS',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'sans-serif', backgroundColor: '#0f172a' }}>
        {children}
      </body>
    </html>
  )
}

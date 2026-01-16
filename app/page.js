export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>FieldDeskOps - Root Page</h1>
      <p>If you can see this, Next.js is working.</p>
      <ul>
        <li><a href="/auth/login">Login Page</a></li>
        <li><a href="/auth/signup">Signup Page</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/debug">Debug Page</a></li>
      </ul>
    </div>
  );
}

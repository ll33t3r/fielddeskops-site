'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const demoUser = localStorage.getItem('demo_user');
    const userEmail = localStorage.getItem('user_email');
    
    if (demoUser === 'true' && userEmail) {
      setUser({
        name: localStorage.getItem('user_name') || 'Demo User',
        email: userEmail
      });
      setLoading(false);
    } else {
      // Not authenticated, redirect to login
      router.push('/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '1rem'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#262626',
        borderRadius: '0.5rem'
      }}>
        <h1>FieldDeskOps Dashboard</h1>
        <div>
          <span>Welcome, {user?.name}!</span>
          <button 
            onClick={handleLogout}
            style={{
              marginLeft: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#FF6700',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>
      
      <main>
        <h2 style={{ marginBottom: '1rem' }}>Your Tools</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            backgroundColor: '#262626', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid #404040'
          }}>
            <h3>ProfitLock</h3>
            <p>Bid Calculator & Quote Manager</p>
            <button style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#FF6700', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}>
              Open
            </button>
          </div>
          
          <div style={{ 
            backgroundColor: '#262626', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid #404040'
          }}>
            <h3>LoadOut</h3>
            <p>Van Inventory Tracker</p>
            <button style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#FF6700', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}>
              Open
            </button>
          </div>
          
          <div style={{ 
            backgroundColor: '#262626', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid #404040'
          }}>
            <h3>SiteSnap</h3>
            <p>Photo Documentation</p>
            <button style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#FF6700', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}>
              Open
            </button>
          </div>
          
          <div style={{ 
            backgroundColor: '#262626', 
            padding: '1.5rem', 
            borderRadius: '0.5rem',
            border: '1px solid #404040'
          }}>
            <h3>SignOff</h3>
            <p>Digital Contracts & Signatures</p>
            <button style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#FF6700', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}>
              Open
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

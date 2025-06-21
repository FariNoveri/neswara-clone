import React, { useState } from 'react';
import { auth, sendPasswordResetEmail } from './firebaseConfig'; // Sesuaikan path

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email harus diisi');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Link reset password telah dikirim ke email kamu. Cek inbox atau spam folder.');
      setEmail(''); // Clear form
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      // Handle error messages in Indonesian
      switch (error.code) {
        case 'auth/user-not-found':
          setError('Email tidak terdaftar');
          break;
        case 'auth/invalid-email':
          setError('Format email tidak valid');
          break;
        case 'auth/too-many-requests':
          setError('Terlalu banyak percobaan. Coba lagi nanti.');
          break;
        default:
          setError('Terjadi kesalahan. Coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Lupa Password</h2>
        <p>Masukkan email kamu untuk mendapatkan link reset password</p>
        
        <form onSubmit={handleResetPassword}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Masukkan email kamu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="email-input"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="reset-button"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        
        <div className="back-to-login">
          <a href="/login">Kembali ke Login</a>
        </div>
      </div>
      
      <style jsx>{`
        .forgot-password-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
        }
        
        .forgot-password-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        p {
          text-align: center;
          margin-bottom: 1.5rem;
          color: #666;
          font-size: 0.95rem;
        }
        
        .input-group {
          margin-bottom: 1rem;
        }
        
        .email-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        
        .email-input:focus {
          outline: none;
          border-color: #007bff;
        }
        
        .reset-button {
          width: 100%;
          padding: 12px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .reset-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        .reset-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #dc3545;
          text-align: center;
          margin-top: 1rem;
          font-size: 0.9rem;
        }
        
        .success-message {
          color: #28a745;
          text-align: center;
          margin-top: 1rem;
          font-size: 0.9rem;
        }
        
        .back-to-login {
          text-align: center;
          margin-top: 1.5rem;
        }
        
        .back-to-login a {
          color: #007bff;
          text-decoration: none;
          font-size: 0.9rem;
        }
        
        .back-to-login a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
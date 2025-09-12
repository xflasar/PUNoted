import React, { useState } from 'react';
import { Box, Button, Typography, TextField, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/system';
import { FaUserPlus, FaSignInAlt, FaEnvelopeOpenText, FaCheckCircle, FaUndoAlt } from 'react-icons/fa';


const AuthBackgroundBox = styled(Box)(({ theme }) => ({
  width: '100vw',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  color: theme.palette.common.white,
  background: 'radial-gradient(at 50% 0%, rgba(20, 20, 40, 0.8) 0%, rgba(10, 10, 20, 0.9) 70%, rgba(0, 0, 0, 1) 100%)',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: -1,
  animation: 'none',
  backgroundSize: '100% 100%',
}));

const AuthContentBox = styled(Box)(({ theme }) => ({
  background: 'rgba(25, 25, 50, 0.8)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 0 50px rgba(123, 104, 238, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  width: '100%',
  maxWidth: 450,
  zIndex: 2,
  position: 'relative',
}));

interface AuthenticationBoxProps {
  onLoginSuccess: () => void;
  onBackToLanding: () => void;
}

const AuthenticationBox: React.FC<AuthenticationBoxProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationStep, setRegistrationStep] = useState<'form' | 'verification'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (isLogin) {
      try {
        const response = await fetch('https://punoted.ddns.net/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: username, password }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('expiresAt', data.expires_at.toString());
          localStorage.setItem('username', data.username);
          onLoginSuccess();
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Login failed. Please check your credentials.');
        }
      } catch (err) {
        setError('Network error or server unavailable. Please try again.');
        console.error('Login error:', err);
      } finally {
        setIsLoading(false);
      }
    } else { // Register Flow
      if (registrationStep === 'form') {
        // Simulate Register API Call
        try {
          // const response = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
          // const data = await response.json();
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

          if (username && email && password) {
            setMessage('Registration successful! Please check your email for a verification code.');
            setRegistrationStep('verification');
          } else {
            setError('Please fill in all registration fields.');
          }
        } catch (err) {
          setError('Registration failed. Please try again.');
          console.error('Registration error:', err);
        } finally {
          setIsLoading(false);
        }
      } else if (registrationStep === 'verification') {
        try {
          // const response = await fetch('/api/verification', { method: 'POST', body: JSON.stringify({ email, verificationCode }) });
          // const data = await response.json();
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

          if (verificationCode === '123456') { // Simulate successful verification
            setMessage('Account verified successfully! You can now log in.');
            setIsLogin(true);
            setRegistrationStep('form');
            setUsername('');
            setEmail('');
            setPassword('');
            setVerificationCode('');
          } else {
            setError('Invalid verification code. Please try again.');
          }
        } catch (err) {
          setError('Verification failed. Please try again.');
          console.error('Verification error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleSwitchToRegister = () => {
    setIsLogin(false);
    setRegistrationStep('form');
    setError(null);
    setMessage(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setVerificationCode('');
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    setRegistrationStep('form');
    setError(null);
    setMessage(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setVerificationCode('');
  };

  const handleResendVerification = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      // Simulate resending verification code API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Verification code re-sent. Please check your email.');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthBackgroundBox>
      <AuthContentBox>
        <Typography variant="h4" color="text.primary" sx={{ mb: 2, fontWeight: 'bold' }}>
          {isLogin ? 'Login to PUNoted' : (registrationStep === 'form' ? 'Register for PUNoted' : 'Verify Your Account')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

        <form onSubmit={handleAuthSubmit}>
          {registrationStep === 'form' ? (
            <>
              {!isLogin && (
                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{
                    input: { color: 'white' },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: '#7b68ee' },
                      '&.Mui-focused fieldset': { borderColor: '#7b68ee' },
                    },
                  }}
                />
              )}
              <TextField
                label="Username"
                type="username"
                variant="outlined"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  input: { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#7b68ee' },
                    '&.Mui-focused fieldset': { borderColor: '#7b68ee' },
                  },
                }}
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  input: { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#7b68ee' },
                    '&.Mui-focused fieldset': { borderColor: '#7b68ee' },
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2, bgcolor: '#7b68ee', '&:hover': { bgcolor: '#6a5acd' } }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : (
                  <>
                    {isLogin ? <FaSignInAlt style={{ marginRight: '0.75rem' }} /> : <FaUserPlus style={{ marginRight: '0.75rem' }} />}
                    {isLogin ? 'Login' : 'Register'}
                  </>
                )}
              </Button>
            </>
          ) : ( // Verification step
            <>
              <TextField
                label="Email (for verification)"
                type="email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  input: { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#7b68ee' },
                    '&.Mui-focused fieldset': { borderColor: '#7b68ee' },
                  },
                }}
              />
              <TextField
                label="Verification Code"
                variant="outlined"
                fullWidth
                margin="normal"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                sx={{
                  input: { color: 'white' },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#7b68ee' },
                    '&.Mui-focused fieldset': { borderColor: '#7b68ee' },
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2, bgcolor: '#7b68ee', '&:hover': { bgcolor: '#6a5acd' } }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : (
                  <>
                    <FaCheckCircle style={{ marginRight: '0.75rem' }} /> Verify Account
                  </>
                )}
              </Button>
              <Button
                onClick={handleResendVerification}
                sx={{ mt: 1, color: '#aaa' }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={18} color="inherit" /> : (
                  <>
                    <FaEnvelopeOpenText style={{ marginRight: '0.5rem' }} /> Resend Verification Code
                  </>
                )}
              </Button>
              <Button onClick={() => setRegistrationStep('form')} sx={{ mt: 1, color: '#aaa' }}>
                <FaUndoAlt style={{ marginRight: '0.5rem' }} /> Go back to Registration
              </Button>
            </>
          )}
        </form>

        {registrationStep === 'form' && (
          <Button onClick={isLogin ? handleSwitchToRegister : handleSwitchToLogin} sx={{ mt: 1, color: '#aaa' }}>
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </Button>
        )}
        <Button onClick={onBackToLanding} sx={{ mt: 2, color: '#aaa' }}>
          Back to Home
        </Button>
      </AuthContentBox>
    </AuthBackgroundBox>
  );
};

export default AuthenticationBox;

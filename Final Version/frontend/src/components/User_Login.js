import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Login successful');
        setMessageType('success');
        login(result.user._id, result.user.email, 'Player');
        navigate('/PredictImage');
      } else {
        setMessage(result.message || 'Invalid email or password');
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred while trying to log in');
      setMessageType('danger');
    }
  };

  return (
    <div className="appointment">
      <div className="container">
        <div className="titlepage text_align_center">
          <h2>User Login</h2>
          <p>Please enter your credentials to log in</p>
        </div>
        <form id="login_form" className="main_form" onSubmit={handleSubmit}>
          <input
            className="form_control"
            placeholder="Email*"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="form_control"
            placeholder="Password*"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {message && (
            <div className={`alert alert-${messageType}`} role="alert">
              <button
                type="button"
                className="close"
                onClick={() => setMessage('')}
                aria-label="Close"
              >
                <span aria-hidden="true">×</span>
              </button>
              {message}
            </div>
          )}
          <button type="submit" className="send_btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
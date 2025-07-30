import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    contact: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Registration successful');
        setMessageType('success');
        login(result.user._id, result.user.email, 'User');
      //  navigate('/dashboard'); // Redirect to the relevant page
      } else {
        setMessage(result.message || 'Registration failed');
        setMessageType('danger');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage(`An error occurred: ${error.message}`);
      setMessageType('danger');
    }
  };

  return (
    <div className="appointment">
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="titlepage text_align_center">
              <h2>User Register</h2>
              <p>Please fill out the form to register as a User</p>
            </div>
			<div className="col-md-12">
                  {message && (
                    <div className={`alert alert-${messageType} alert-dismissible`} role="alert">
                      <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">×</span>
                      </button>
                      {message}
                    </div>
                  )}
                </div>
          </div>
          <div className="col-md-12">
            <form id="register_form" className="main_form" onSubmit={handleRegister}>
              <div className="row">
                <div className="col-md-6">
                  <input
                    className="form_control"
                    placeholder="Full Name*"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    className="form_control"
                    placeholder="Address*"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    className="form_control"
                    placeholder="Contact*"
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    className="form_control"
                    placeholder="Email*"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    className="form_control"
                    placeholder="Password*"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="col-md-12">
                  <button type="submit" className="send_btn">Register</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

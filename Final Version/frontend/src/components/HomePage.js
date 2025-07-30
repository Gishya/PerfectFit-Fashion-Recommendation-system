import React from 'react';

const HomePage = () => {
  return (
    <div
      className="homepage"
      style={{
        backgroundImage: `url('/static/Assets/images/back.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        className="container"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '20px',
          borderRadius: '8px',
          color: '#ffffff',
          textAlign: 'center',
          maxWidth: '700px',
        }}
      >
        <h1 style={{ color: '#ffffff' }}>Welcome to Outfit Recommender</h1>
        <br />
        <p style={{ color: '#ffffff' }}>
          Discover your perfect outfit with our AI-powered recommendation system! We analyze your skin tone, body shape, and the occasion to suggest the best outfit that enhances your style and confidence.
        </p>
        <p style={{ color: '#ffffff' }}>
          Whether you're preparing for a formal event, casual outing, or a special occasion, we provide personalized fashion recommendations to match your preferences and unique features.
        </p>
        <p style={{ color: '#ffffff' }}>
          Simply upload a picture, select your occasion, and let our AI guide you to the best outfit choices. Elevate your fashion with AI-powered styling today!
        </p>
      </div>
    </div>
  );
};

export default HomePage;

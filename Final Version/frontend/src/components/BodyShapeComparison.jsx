import React, { useState, useEffect } from 'react';
import { User, Sparkles, Lightbulb, RefreshCw, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import './BodyShapeComparison.css';

const BodyShapeComparison = ({ 
  userImage, 
  predictedBodyShape, 
  onSilhouetteProcessed,
  isVisible = true 
}) => {
  const [userSilhouette, setUserSilhouette] = useState(null);
  const [standardSilhouette, setStandardSilhouette] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (userImage && predictedBodyShape && isVisible) {
      processSilhouette();
    }
  }, [userImage, predictedBodyShape, isVisible]);

  const processSilhouette = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert file to base64 if it's a File object
      let imageData = userImage;
      if (userImage instanceof File) {
        imageData = await fileToBase64(userImage);
      }

      const response = await fetch('http://127.0.0.1:5000/api/process-silhouette', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          body_shape: predictedBodyShape
        })
      });

      const data = await response.json();

      if (data.success) {
        setUserSilhouette(data.user_silhouette);
        setStandardSilhouette(data.standard_silhouette);
        setShowComparison(true);
        
        // Callback to parent component
        if (onSilhouetteProcessed) {
          onSilhouetteProcessed(data);
        }
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to process silhouette');
      console.error('Error processing silhouette:', err);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const bodyShapeData = {
    'Apple': {
      description: 'Broader midsection with narrower hips and shoulders',
      icon: '🍎',
      colorClass: 'apple',
      tips: 'Focus on defining your waist and balancing your proportions with A-line dresses and empire waists.'
    },
    'Hourglass': {
      description: 'Balanced shoulders and hips with a defined waist',
      icon: '⏳',
      colorClass: 'hourglass',
      tips: 'Emphasize your natural waist with fitted styles, wrap dresses, and belted designs.'
    },
    'Inverted': {
      description: 'Broader shoulders with narrower hips',
      icon: '🔻',
      colorClass: 'inverted',
      tips: 'Balance your silhouette with A-line skirts, wide-leg pants, and tops that add volume to your lower half.'
    },
    'Rectangle': {
      description: 'Similar measurements for shoulders, waist, and hips',
      icon: '▭',
      colorClass: 'rectangle',
      tips: 'Create curves and definition with layering, belts, and styles that add shape to your silhouette.'
    },
    'Triangle': {
      description: 'Narrower shoulders with broader hips',
      icon: '🔺',
      colorClass: 'triangle',
      tips: 'Balance your proportions with tops that add volume to your upper body and structured shoulders.'
    }
  };

  const currentShape = bodyShapeData[predictedBodyShape] || bodyShapeData['Rectangle'];

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="body-shape-container">
        <div className="body-shape-card">
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <div className="loading-spinner-secondary"></div>
              </div>
              <div className="loading-text-container">
                <h3 className="loading-title">Analyzing Your Body Shape</h3>
                <p className="loading-description">Creating your personalized silhouette comparison...</p>
              </div>
              <div className="loading-progress-bar">
                <div className="loading-progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="body-shape-container">
        <div className="body-shape-card">
          <div className="error-container">
            <div className="error-content">
              <div className="error-icon-container">
                <AlertCircle className="error-icon" />
              </div>
              <div className="error-text-container">
                <h3 className="error-title">Oops! Something went wrong</h3>
                <p className="error-description">{error}</p>
              </div>
              <button 
                onClick={processSilhouette}
                className="error-button"
              >
                <RefreshCw className="error-button-icon" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userSilhouette || !standardSilhouette) {
    return null;
  }

  return (
    <div className="body-shape-container">
      <div className="body-shape-card">
        {/* Header Section */}
        <div className={`body-shape-header ${currentShape.colorClass}-gradient`}>
          <div className="header-content">
            <div className="header-top">
              <div>
                <div className="header-title-row">
                  <span className="header-icon">{currentShape.icon}</span>
                  <h2 className="header-title">Your Body Shape</h2>
                </div>
                <div className="header-shape-row">
                  <span className="header-shape-text">{predictedBodyShape}</span>
                  <CheckCircle className="header-check-icon" />
                </div>
                <p className="header-description">
                  {currentShape.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="body-shape-content">
          {/* Silhouette Comparison */}
          <div className="silhouette-grid">
            {/* User Silhouette */}
            <div className="silhouette-item">
              <div className="silhouette-content">
                <div className="silhouette-header">
                  <User className="silhouette-header-icon" />
                  <h3 className="silhouette-title">Your Silhouette</h3>
                </div>
                <div className="silhouette-image-container">
                  <div className="silhouette-image-wrapper">
                    <div className="silhouette-image-frame">
                      <img 
                        src={`data:image/png;base64,${userSilhouette}`}
                        alt="Your silhouette"
                        className="silhouette-image"
                      />
                    </div>
                  </div>
                  <div className="silhouette-caption">
                    <Camera className="silhouette-caption-icon" />
                    <span className="silhouette-caption-text">Extracted from your photo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Silhouette */}
            <div className="silhouette-item">
              <div className="silhouette-content">
                <div className="silhouette-header">
                  <Sparkles className="silhouette-header-icon" />
                  <h3 className="silhouette-title">Standard {predictedBodyShape}</h3>
                </div>
                <div className="silhouette-image-container">
                  <div className="silhouette-image-wrapper">
                    <div className="silhouette-image-frame">
                      <img 
                        src={`data:image/png;base64,${standardSilhouette}`}
                        alt={`Standard ${predictedBodyShape} silhouette`}
                        className="silhouette-image"
                      />
                    </div>
                  </div>
                  <div className="silhouette-caption">
                    <span className="silhouette-caption-shape">{currentShape.icon}</span>
                    <span className="silhouette-caption-text">Typical {predictedBodyShape.toLowerCase()} shape</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Style Tips Section */}
          <div className={`style-tips-container ${currentShape.colorClass}-bg`}>
            <div className="style-tips-content">
              <div className="style-tips-icon-container">
                <Lightbulb className="style-tips-icon" />
              </div>
              <div className="style-tips-text-container">
                <h3 className={`style-tips-title ${currentShape.colorClass}-text`}>
                  Style Tips for Your {predictedBodyShape} Shape
                </h3>
                <p className={`style-tips-description ${currentShape.colorClass}-text`}>
                  {currentShape.tips}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              onClick={processSilhouette}
              className={`action-button action-button-primary ${currentShape.colorClass}-gradient`}
            >
              <RefreshCw className="action-button-icon" />
              Refresh Analysis
            </button>
            <button 
              onClick={() => setShowComparison(!showComparison)}
              className="action-button action-button-secondary"
            >
              <User className="action-button-icon" />
              {showComparison ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyShapeComparison;
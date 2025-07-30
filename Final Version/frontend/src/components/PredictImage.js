import React, { useState, useEffect } from "react";
import {
  Camera,
  Mic,
  MicOff,
  Upload,
  Sparkles,
  User,
  Palette,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import "./PredictImage.css";
import axios from "axios";
import BodyShapeComparison from "./BodyShapeComparison";

const PredictImage = () => {
  const [file, setFile] = useState(null);
  const [occasion, setOccasion] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [predictedShape, setPredictedShape] = useState("");
  const [dressRecommendation, setDressRecommendation] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBodyShapeComparison, setShowBodyShapeComparison] = useState(false);
  const [silhouetteData, setSilhouetteData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [overlayImage, setOverlayImage] = useState(null);
  const [overlayTitle, setOverlayTitle] = useState("");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const occasions = [
    { value: "wedding", label: "Wedding", icon: "💒" },
    { value: "party", label: "Party", icon: "🎉" },
    //{ value: "casual", label: "Casual", icon: "👕" },
   { value: "formal", label: "Formal", icon: "👔" },
// { value: "interview", label: "Interview", icon: "💼" },
   // { value: "date", label: "Date", icon: "❤️" },
  ];

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      console.log("Speech recognition started");
      setError(""); // Clear any previous errors
    };

    recognitionInstance.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceText(transcript);
      console.log("Transcript:", transcript);
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(`Speech recognition error: ${event.error}. Please try again.`);
      setIsRecording(false);
    };

    recognitionInstance.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
    };

    setRecognition(recognitionInstance);
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
    setShowBodyShapeComparison(false);
    setSilhouetteData(null);
    setCurrentStep(2);
  };

  // Enhanced overlay functions with zoom
  const openOverlay = (imageSrc, title) => {
    setOverlayImage(imageSrc);
    setOverlayTitle(title);
    setIsOverlayOpen(true);
    // Reset zoom and pan when opening
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    // Prevent body scroll when overlay is open
    document.body.style.overflow = 'hidden';
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
    setOverlayImage(null);
    setOverlayTitle("");
    // Reset zoom and pan
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
    setIsDragging(false);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };

  // Pan functions
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panX,
        y: e.clientY - panY
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Handle ESC key to close overlay
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOverlayOpen) {
        closeOverlay();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOverlayOpen]);

  const handleUserImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (imagePreview) {
      openOverlay(imagePreview, "Your Uploaded Photo");
    }
  };

  const handleRecommendationImageClick = () => {
    if (dressRecommendation) {
      const imageSrc = `http://127.0.0.1:5000/static/outfits/${dressRecommendation.image}`;
      openOverlay(imageSrc, dressRecommendation.name);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setVoiceText("");
      recognition.start();
      setIsRecording(true);
    }
  };

  const analyzeText = () => {
    if (!voiceText) {
      setError("Please record some voice input first.");
      return;
    }

    const validOccasions = [
      "wedding",
      "party",
      "casual",
      "formal",
      "interview",
      "date",
    ];
    const foundOccasion = validOccasions.find((occ) =>
      voiceText.toLowerCase().includes(occ)
    );

    if (foundOccasion) {
      setOccasion(foundOccasion);
      setError("");
      setCurrentStep(3);
    } else {
      setError(
        "No valid occasion found. Try saying words like 'wedding', 'party', or 'formal'."
      );
    }
  };

  const handleUpload = async () => {
    if (!file || !occasion) {
      setError("Please select a file and occasion.");
      return;
    }

    setError("");
    setSkinTone("");
    setPredictedShape("");
    setDressRecommendation(null);
    setExplanation("");
    setIsLoading(true);
    setShowBodyShapeComparison(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload image
      const uploadResponse = await axios.post(
        "http://127.0.0.1:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Get prediction
      const predictResponse = await axios.post(
        "http://127.0.0.1:5000/predict",
        {
          image_url: uploadResponse.data.image_url,
          occasion: occasion.toLowerCase(),
        }
      );

      const { skin_tone, predicted_shape, dress_recommendation, explanation } =
        predictResponse.data;

      setSkinTone(skin_tone);
      setPredictedShape(predicted_shape);

      if (typeof dress_recommendation === "object") {
        console.log("Dress Recommendation:", dress_recommendation);
        setDressRecommendation({
          name: dress_recommendation["Dress Name"],
          image: dress_recommendation["Image Name"],
        });
      } else {
        setDressRecommendation(null);
      }

      setExplanation(explanation || "No specific explanation available.");

      // Show body shape comparison after successful prediction
      if (predicted_shape) {
        setShowBodyShapeComparison(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.error ||
          "An error occurred while processing your request."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSilhouetteProcessed = (data) => {
    setSilhouetteData(data);
  };

  const toggleBodyShapeComparison = () => {
    setShowBodyShapeComparison(!showBodyShapeComparison);
  };

  const StepIndicator = ({ step, isActive, isCompleted }) => (
    <div
      className={`step-indicator ${isCompleted ? "completed" : ""} ${
        isActive ? "active" : ""
      }`}
    >
      {isCompleted ? "✓" : step}
    </div>
  );

  return (
    <div className="app-container">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="header-icon">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="main-title">AI Style Advisor</h1>
          <p className="text-gray-600 text-lg">
            Discover your perfect outfit with AI-powered recommendations

          </p>
        </div>

        {/* Progress Steps */}

        <div className="flex justify-center mb-8">
          <div className="progress-container">
            <StepIndicator
              step={1}
              isActive={currentStep === 1}
              isCompleted={currentStep > 1}
            />
            <div
              className={`progress-line ${currentStep > 1 ? "completed" : ""}`}
            />
            <StepIndicator
              step={2}
              isActive={currentStep === 2}
              isCompleted={currentStep > 2}
            />
            <div
              className={`progress-line ${currentStep > 2 ? "completed" : ""}`}
            />
            <StepIndicator
              step={3}
              isActive={currentStep === 3}
              isCompleted={currentStep > 3}
            />
            <div
              className={`progress-line ${currentStep > 3 ? "completed" : ""}`}
            />
            <StepIndicator
              step={4}
              isActive={currentStep === 4}
              isCompleted={false}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Content */}
          <div className="main-card">
            <div className="text-gray-600 text-lg space-y-2">
  <p> <b>Please upload a clear full-body image.</b></p>
  <p> - Make sure you're standing straight with your arms visible.</p>
  <p> - Use a plain or clean background.</p>
  <p> - Accepted formats: JPG, JPEG, PNG.</p>
  <p> - Max file size: 5MB.</p>
</div>
            {/* Step 1: Upload Photo */}
            <div className="max-w-md mx-auto p-6">
              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <div className="preview-image relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={handleUserImageClick}
                        />
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center cursor-pointer"
                          onClick={handleUserImageClick}
                        >
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </div>
                      <div>
                        <p className="text-purple-600 font-medium">
                          ✓ Photo uploaded successfully
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Click image to enlarge
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="flex flex-col items-center cursor-pointer">
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl font-medium text-gray-700 mb-2">
                          Upload your photo
                        </p>
                      </div>
                      <p className="text-gray-500">
                        Drag and drop or click to select
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Step 2: Voice Input */}
            <div className="mb-8 mt-4">
              <h2 className="section-title">
                <Mic className="w-6 h-6 mr-3 text-purple-600" />
                Tell Us About Your Occasion (Optional)
              </h2>
              <div className="voice-input-container">
                <textarea
                  placeholder="Describe your occasion or click the mic to speak..."
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  className="voice-textarea"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={toggleRecording}
                    className={`voice-button ${isRecording ? "recording" : ""}`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        Start Speaking
                      </>
                    )}
                  </button>
                  <button
                    onClick={analyzeText}
                    disabled={!voiceText}
                    className="analyze-button"
                  >
                    <Search className="w-5 h-5" />
                    Analyze
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: Occasion Selection */}
            <div className="mb-8">
              <h2 className="section-title">
                <Sparkles className="w-6 h-6 mr-3 text-purple-600" />
                Select Your Occasion
              </h2>
              <div className="occasions-grid">
                {occasions.map((occ) => (
                  <button
                    key={occ.value}
                    onClick={() => {
                      setOccasion(occ.value);
                      setCurrentStep(3);
                    }}
                    className={`occasion-button ${
                      occasion === occ.value ? "selected" : ""
                    }`}
                  >
                    <div className="text-2xl mb-2">{occ.icon}</div>
                    <div className="font-medium">{occ.label}</div>
                  </button>
                ))}
              </div>
              {occasion && (
                <div className="occasion-selected">
                  <p className="text-green-800 font-medium">
                    ✓ Selected:{" "}
                    {occasions.find((o) => o.value === occasion)?.label}
                  </p>
                </div>
              )}
            </div>

            {/* Get Recommendation Button */}
            <button
              onClick={handleUpload}
              disabled={!file || !occasion || isLoading}
              className={`recommendation-button ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="loading-spinner" />
                  Analyzing Your Style...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Get My Style Recommendation
                </div>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <p className="text-red-800 font-medium">⚠️ {error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          {(skinTone || predictedShape) && (
            <div className="results-card">
              <h2 className="section-title">
                <User className="w-6 h-6 mr-3 text-purple-600" />
                Your Style Analysis
              </h2>
              <div className="analysis-grid">
                <div className="analysis-item skin-tone">
                  <div className="flex items-center mb-3">
                    <Palette className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-bold text-gray-800">Skin Tone</h3>
                  </div>
                  <p className="text-xl font-medium text-blue-700">
                    {skinTone}
                  </p>
                </div>
                <div className="analysis-item body-shape">
                  <div className="flex items-center mb-3">
                    <User className="w-5 h-5 text-pink-600 mr-2" />
                    <h3 className="font-bold text-gray-800">Body Shape</h3>
                  </div>
                  <p className="text-xl font-medium text-pink-700">
                    {predictedShape}
                  </p>
                </div>
              </div>
              {predictedShape && (
                <div>
                  <button
                    onClick={toggleBodyShapeComparison}
                    className="body-shape-toggle"
                  >
                    <User className="w-5 h-5" />
                    {showBodyShapeComparison ? "Hide" : "Show"} Body Shape
                    Comparison
                    {showBodyShapeComparison ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showBodyShapeComparison && (
                    <div className="mt-6">
                      <BodyShapeComparison
                        userImage={file}
                        predictedBodyShape={predictedShape}
                        onSilhouetteProcessed={handleSilhouetteProcessed}
                        isVisible={showBodyShapeComparison}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommendation Section */}
          {dressRecommendation && (
            <div className="recommendation-card">
              <h2 className="section-title">
                <Sparkles className="w-6 h-6 mr-3 text-purple-600" />
                Your Perfect Outfit
              </h2>
              <div className="recommendation-content">
                <div className="recommendation-image">
                  <img
                    src={`http://127.0.0.1:5000/static/outfits/${dressRecommendation.image}`}
                    alt={dressRecommendation.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={handleRecommendationImageClick}
                  />
                </div>
                <div className="recommendation-details">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {dressRecommendation.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click the image to enlarge and view details.
                  </p>
                  {explanation && (
                    <div className="explanation-box">
                      <h4 className="font-bold text-purple-800 mb-2">
                        Why This Works For You
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No Recommendation Message */}
          {dressRecommendation === null && skinTone && (
            <div className="no-recommendation-card">
              <div className="text-center">
                <div className="no-recommendation-icon">
                  <Search className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Perfect Match Found
                </h3>
                <p className="text-gray-600">
                  We couldn't find a perfect match for your {occasion} occasion
                  with {skinTone.toLowerCase()} skin tone and{" "}
                  {predictedShape.toLowerCase()} body shape, but don't worry!
                  Our AI is learning and improving.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Image Overlay with Zoom Controls */}
      {isOverlayOpen && (
        <div className="image-overlay" onClick={closeOverlay}>
          <div className="image-overlay-content" onClick={(e) => e.stopPropagation()}>
            {/* Header with title and close button */}
            <div className="image-overlay-header">
              <h3 className="image-overlay-title">{overlayTitle}</h3>
              <button className="image-overlay-close" onClick={closeOverlay}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Zoom Controls */}
            <div className="image-overlay-controls">
              <button
                onClick={handleZoomIn}
                className="zoom-control-btn"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="zoom-control-btn"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="zoom-control-btn"
                title="Reset Zoom"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <span className="zoom-level-display">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
            
            {/* Image Container */}
            <div 
              className="image-overlay-image-container"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={overlayImage}
                alt={overlayTitle}
                className="image-overlay-image"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                }}
                draggable={false}
              />
            </div>
            
            {/* Instructions */}
            <div className="image-overlay-instructions">
              <p className="text-sm text-gray-300">
                Use mouse wheel to zoom • Click and drag to pan when zoomed in • ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictImage;
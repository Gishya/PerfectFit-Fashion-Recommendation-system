import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import MainLayout from './components/MainLayout';
import Register from './components/User_Register';
import Login from './components/User_Login';
import HomePage from './components/HomePage';
import PredictImage from './components/PredictImage';


 

const App = () => {
 
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
		   <Route path="/" element={<HomePage />} />
            <Route path="/User_Register" element={<Register />} />
            <Route path="/User_Login" element={<Login />} />
            
            <Route path="/PredictImage" element={<PredictImage />} />
			
 
			
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
};

export default App;

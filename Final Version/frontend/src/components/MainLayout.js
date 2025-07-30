import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="loader_bg">
        <div className="loader"><img src="/static/Assets/images/loading.gif" alt="#"/></div>
      </div>
      <div className="full_bg">
        <header className="header-area">
          <div className="container">
            <div className="row d_flex">
              <div className="col-md-3 col-sm-3">
               
			   <div className="logo">
                 <Link to="/" style={{ fontSize: '40px' }}> PerfectFit  </Link>

                
				</div>
              </div>
              <div className="col-md-9 col-sm-9">
                <div className="navbar-area">
                  <nav className="site-navbar">
                    <ul>
                      <li><Link to="/">Home</Link></li>
                      {!user ? (
                        <>
                          <li><Link to="/User_login">Login</Link></li>
                          <li><Link to="/User_Register">Register</Link></li>
                        </>
                      ) : (
                        <>
                          <li><Link to="/PredictImage">Recommendation</Link></li>
						   
                          <li><button onClick={handleLogout}>Logout</button></li>
                        </>
						
						
						
						
                      )}
                    </ul>
                    <button className="nav-toggler">
                      <span></span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main>{children}</main>
    </>
  );
};

export default MainLayout;

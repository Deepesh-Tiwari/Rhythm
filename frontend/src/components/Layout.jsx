import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="grow">
        {children}
      </main>
      {/* You can add a Footer component here later */}
    </div>
  );
};

export default Layout;
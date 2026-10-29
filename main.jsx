import React from 'react';
import { createRoot } from 'react-dom/client';
import FitnessAffiliateHub from './page.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FitnessAffiliateHub />
  </React.StrictMode>,
);

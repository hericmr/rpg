import React, { useEffect, useState } from 'react';
import '../styles/OpeningAnimation.css';

interface OpeningAnimationProps {
  onAnimationComplete: () => void;
}

const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onAnimationComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const steps = [
      { delay: 1000, action: () => setCurrentStep(1) },  // Mostra o título
      { delay: 2000, action: () => setCurrentStep(2) },  // Mostra o subtítulo
      { delay: 3000, action: () => setCurrentStep(3) },  // Mostra o logo
      { delay: 4000, action: () => setCurrentStep(4) },  // Fade out
      { delay: 5000, action: () => {
        setIsVisible(false);
        onAnimationComplete();
      }}
    ];

    const timers = steps.map(step => 
      setTimeout(step.action, step.delay)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <div className="opening-animation">
      <div className="animation-content">
        {currentStep >= 1 && (
          <h1 className="title">Bem-vindo ao RPG</h1>
        )}
        {currentStep >= 2 && (
          <h2 className="subtitle">Uma aventura épica está prestes a começar</h2>
        )}
        {currentStep >= 3 && (
          <div className="logo-container">
            <div className="logo">⚔️</div>
          </div>
        )}
        {currentStep >= 4 && (
          <div className="fade-out-overlay" />
        )}
      </div>
    </div>
  );
};

export default OpeningAnimation; 
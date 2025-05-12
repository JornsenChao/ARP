// --- 1) 你可以单独建一个组件: StepProgressBar.jsx ---

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Stepper, Step, StepButton } from '@mui/material';

const steps = [
  { label: 'Identify Hazard', path: '/workflow/step1' },
  { label: 'Assess Risk', path: '/workflow/step2' },
  { label: 'Explore Resources', path: '/workflow/step3' },
  { label: 'Finalize', path: '/workflow/step4' },
];

export default function StepProgressBar() {
  const location = useLocation();

  // 根据当前url判断哪个step处于激活
  const activeStepIndex = steps.findIndex((s) =>
    location.pathname.startsWith(s.path)
  );
  const currentStep = activeStepIndex >= 0 ? activeStepIndex : 0;

  return (
    <Stepper nonLinear activeStep={currentStep} sx={{ mb: 2 }}>
      {steps.map((s, index) => (
        <Step key={s.label} completed={false}>
          <StepButton component={Link} to={s.path}>
            {s.label}
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );
}

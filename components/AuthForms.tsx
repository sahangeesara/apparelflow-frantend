'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthForms() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <main className="auth-page">
      {showSignup
        ? <SignupForm onLogin={() => setShowSignup(false)} />
        : <LoginForm onSignup={() => setShowSignup(true)} />}
    </main>
  );
}

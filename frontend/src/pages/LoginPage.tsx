import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import { Button, Input, Card, Loading } from '../components/ui';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, error, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(true); // Toggle for dev mode

  // Form state for development login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      setIsLoading(true);
      try {
        await loginWithGoogle(credentialResponse.credential);
        navigate('/dashboard');
      } catch (err) {
        console.error('Login failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error when component unmounts
  useState(() => {
    return () => clearError();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 p-4">
            <Logo size="large" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">EducLove</h1>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Development Mode Toggle */}
        <div className="mb-4 flex items-center justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsDevelopmentMode(!isDevelopmentMode)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            {isDevelopmentMode ? 'Utiliser Google OAuth' : 'Mode développement'}
          </Button>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4">
          {isDevelopmentMode ? (
            // Development Mode Login
            <>
              <form onSubmit={handleDevLogin} className="space-y-4">
                <Input
                  type="email"
                  id="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marie.dupont@educnat.gouv.fr"
                  required
                />

                <Input
                  type="password"
                  id="password"
                  label="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>

              {/* Test Accounts Info */}
              <Card variant="bordered" className="mt-4 p-4 bg-blue-50">
                <p className="text-sm font-semibold text-blue-900 mb-2">Comptes de test:</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmail('marie.dupont@educnat.gouv.fr');
                      setPassword('password123');
                    }}
                    className="block w-full text-left text-xs p-0 h-auto justify-start hover:text-blue-900 hover:underline"
                  >
                    • marie.dupont@educnat.gouv.fr / password123
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmail('jean.martin@educnat.gouv.fr');
                      setPassword('password123');
                    }}
                    className="block w-full text-left text-xs p-0 h-auto justify-start hover:text-blue-900 hover:underline"
                  >
                    • jean.martin@educnat.gouv.fr / password123
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmail('sophie.bernard@educnat.gouv.fr');
                      setPassword('password123');
                    }}
                    className="block w-full text-left text-xs p-0 h-auto justify-start hover:text-blue-900 hover:underline"
                  >
                    • sophie.bernard@educnat.gouv.fr / password123
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Ou utilisez n'importe quel email - un compte sera créé automatiquement
                </p>
              </Card>
            </>
          ) : (
            // Google OAuth Login
            <>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                  theme="outline"
                  width="100%"
                  locale="fr"
                />
              </div>

              {isLoading && (
                <div className="text-center">
                  <Loading size="md" />
                  <p className="mt-2 text-sm text-gray-600">Connexion en cours...</p>
                </div>
              )}

              <p className="text-center text-sm text-gray-600 mt-4">
                Nécessite une configuration Google OAuth
              </p>
            </>
          )}
        </div>

        {/* Sign up link */}
        <p className="text-center text-gray-600 mt-8">
          Pas encore de compte?{' '}
          <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
            S'inscrire
          </Link>
        </p>

        {/* Back to home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Retour à l'accueil
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;

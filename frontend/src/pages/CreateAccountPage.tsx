import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { api } from '../services/api';

interface PasswordStrength {
    score: number;
    strength: 'weak' | 'medium' | 'strong';
    message: string;
    is_valid: boolean;
}

const CreateAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validate email domain in real-time
    useEffect(() => {
        const validateEmail = async () => {
            if (email && email.includes('@')) {
                try {
                    const response = await api.get(`/api/auth/register/validate-email/${email}`);
                    if (!response.data.is_valid) {
                        setEmailError(response.data.message);
                    } else {
                        setEmailError('');
                    }
                } catch {
                    setEmailError('');
                }
            } else {
                setEmailError('');
            }
        };

        const debounce = setTimeout(validateEmail, 500);
        return () => clearTimeout(debounce);
    }, [email]);

    // Validate password strength in real-time
    useEffect(() => {
        const validatePassword = async () => {
            if (password) {
                try {
                    const response = await api.post('/api/auth/register/validate-password', { password });
                    setPasswordStrength(response.data);
                } catch {
                    setPasswordStrength(null);
                }
            } else {
                setPasswordStrength(null);
            }
        };

        const debounce = setTimeout(validatePassword, 300);
        return () => clearTimeout(debounce);
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        // Validate password strength
        if (!passwordStrength || !passwordStrength.is_valid) {
            setError(passwordStrength?.message || 'Le mot de passe n\'est pas assez fort');
            return;
        }

        // Validate email domain
        if (emailError) {
            setError(emailError);
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/register/create', {
                email,
                password,
                password_confirmation: confirmPassword,
                first_name: firstName || undefined
            });

            if (response.data.success) {
                // Redirect to email verification page
                navigate('/email-verification', {
                    state: {
                        email,
                        message: response.data.message
                    }
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (!passwordStrength) return 'bg-gray-200';
        switch (passwordStrength.strength) {
            case 'weak': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'strong': return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const getPasswordStrengthWidth = () => {
        if (!passwordStrength) return '0%';
        return `${(passwordStrength.score / 6) * 100}%`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 p-4">
                        <Logo size="large" className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Créer un compte</h1>
                    <p className="text-gray-600 mt-2">Rejoignez la communauté EducLove</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* First Name (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                            Prénom (optionnel)
                        </label>
                        <input
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            id="firstName"
                            type="text"
                            placeholder="Votre prénom"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email professionnel
                        </label>
                        <input
                            className={`w-full px-4 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                            id="email"
                            type="email"
                            placeholder="prenom.nom@ac-paris.fr"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {emailError && (
                            <p className="mt-1 text-sm text-red-600">{emailError}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Utilisez votre adresse académique (ac-*.fr) ou education.gouv.fr
                        </p>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <input
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Créez un mot de passe fort"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password strength indicator */}
                        {password && (
                            <div className="mt-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600">Force du mot de passe</span>
                                    {passwordStrength && (
                                        <span className={`text-xs font-medium ${passwordStrength.strength === 'weak' ? 'text-red-600' :
                                            passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                                                'text-green-600'
                                            }`}>
                                            {passwordStrength.strength === 'weak' ? 'Faible' :
                                                passwordStrength.strength === 'medium' ? 'Moyen' : 'Fort'}
                                        </span>
                                    )}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                        style={{ width: getPasswordStrengthWidth() }}
                                    />
                                </div>
                                {passwordStrength && !passwordStrength.is_valid && (
                                    <p className="mt-1 text-xs text-red-600">{passwordStrength.message}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                            Confirmer le mot de passe
                        </label>
                        <div className="relative">
                            <input
                                className={`w-full px-4 py-2 pr-10 border ${confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirmez votre mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas</p>
                        )}
                    </div>

                    {/* Terms and conditions */}
                    <div className="text-xs text-gray-600">
                        En créant un compte, vous acceptez nos{' '}
                        <Link to="/terms" className="text-purple-600 hover:text-purple-700">
                            conditions d'utilisation
                        </Link>{' '}
                        et notre{' '}
                        <Link to="/privacy" className="text-purple-600 hover:text-purple-700">
                            politique de confidentialité
                        </Link>.
                    </div>

                    {/* Submit button */}
                    <div className="pt-4">
                        <button
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading || !!emailError || (passwordStrength ? !passwordStrength.is_valid : false)}
                        >
                            {loading ? 'Création en cours...' : 'Créer mon compte'}
                        </button>
                    </div>
                </form>

                {/* Sign in link */}
                <p className="text-center text-gray-600 mt-8">
                    Déjà un compte?{' '}
                    <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                        Se connecter
                    </Link>
                </p>

                {/* Back to home */}
                <div className="text-center mt-4">
                    <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CreateAccountPage;

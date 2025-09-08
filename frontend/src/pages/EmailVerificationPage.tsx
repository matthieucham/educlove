import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { api } from '../services/api';

const EmailVerificationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { email, message } = location.state || { email: '', message: '' };
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');

    const handleResendEmail = async () => {
        setResending(true);
        setResendMessage('');
        setResendError('');

        try {
            const response = await api.post('/auth/register/resend-verification', { email });
            if (response.data.success) {
                setResendMessage(response.data.message || 'Un nouveau lien de vérification a été envoyé.');
            }
        } catch (err: any) {
            setResendError('Une erreur est survenue. Veuillez réessayer plus tard.');
        } finally {
            setResending(false);
        }
    };

    // If no email in state, redirect to create account page
    if (!email) {
        navigate('/create-account');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4 p-4">
                        <Logo size="large" className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Vérifiez votre email</h1>
                </div>

                {/* Email icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                {/* Main message */}
                <div className="text-center mb-8">
                    <p className="text-gray-700 mb-2">
                        {message || 'Un email de vérification a été envoyé à :'}
                    </p>
                    <p className="font-semibold text-purple-600 break-all">
                        {email}
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                    <h2 className="font-semibold text-gray-800 mb-2">Prochaines étapes :</h2>
                    <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        <li>Ouvrez votre boîte mail</li>
                        <li>Cherchez un email de EducLove</li>
                        <li>Cliquez sur le lien de vérification</li>
                        <li>Connectez-vous avec votre mot de passe</li>
                        <li>Complétez votre profil pour accéder à l'application</li>
                    </ol>
                </div>

                {/* Resend success message */}
                {resendMessage && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        {resendMessage}
                    </div>
                )}

                {/* Resend error message */}
                {resendError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {resendError}
                    </div>
                )}

                {/* Resend email button */}
                <div className="mb-6">
                    <button
                        onClick={handleResendEmail}
                        disabled={resending}
                        className="w-full bg-white border-2 border-purple-600 text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resending ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
                    </button>
                </div>

                {/* Spam folder notice */}
                <div className="text-center text-sm text-gray-500 mb-6">
                    <p>
                        Vous ne trouvez pas l'email ?
                    </p>
                    <p>
                        Vérifiez votre dossier spam ou courrier indésirable.
                    </p>
                </div>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Déjà vérifié ?</span>
                    </div>
                </div>

                {/* Login button */}
                <div className="mb-4">
                    <Link to="/login">
                        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition duration-200">
                            Se connecter pour continuer
                        </button>
                    </Link>
                </div>

                {/* Support link */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Besoin d'aide ?{' '}
                        <Link to="/support" className="text-purple-600 hover:text-purple-700 font-semibold">
                            Contactez le support
                        </Link>
                    </p>
                </div>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;

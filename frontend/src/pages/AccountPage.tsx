import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../store/authStore';

const AccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
            <div className="max-w-4xl mx-auto">
                <Card className="p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon Compte</h1>

                    <div className="space-y-6">
                        {/* Account Information Section */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Informations du compte</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                    <p className="text-gray-800">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Nom</label>
                                    <p className="text-gray-800">{user?.name || 'Non défini'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Statut de vérification</label>
                                    <p className="text-gray-800">
                                        {user?.email_verified ? (
                                            <span className="text-green-600">✓ Email vérifié</span>
                                        ) : (
                                            <span className="text-orange-600">Email non vérifié</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sécurité</h2>
                            <Button variant="secondary" size="md">
                                Changer le mot de passe
                            </Button>
                        </div>

                        {/* Privacy Section */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Confidentialité</h2>
                            <div className="space-y-3">
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" className="rounded text-purple-600" />
                                    <span className="text-gray-700">Recevoir des notifications par email</span>
                                </label>
                                <label className="flex items-center space-x-3">
                                    <input type="checkbox" className="rounded text-purple-600" />
                                    <span className="text-gray-700">Rendre mon profil visible dans les recherches</span>
                                </label>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div>
                            <h2 className="text-xl font-semibold text-red-600 mb-4">Zone de danger</h2>
                            <div className="space-y-3">
                                <Button variant="secondary" size="md" className="border-red-300 text-red-600 hover:bg-red-50">
                                    Désactiver temporairement mon compte
                                </Button>
                                <Button variant="secondary" size="md" className="border-red-500 text-red-700 hover:bg-red-50">
                                    Supprimer définitivement mon compte
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Back button */}
                    <div className="mt-8 pt-6 border-t">
                        <Button
                            onClick={() => navigate('/profiles')}
                            variant="secondary"
                            size="md"
                        >
                            Retour au tableau de bord
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AccountPage;

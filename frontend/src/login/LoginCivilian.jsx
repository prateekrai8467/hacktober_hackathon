import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';

export const LoginCivilian = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        navigate('/dashboard/civilian');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
            <div className="absolute top-8 left-8">
                <Link to="/" className="text-dark/70 font-data hover:text-accent transition-colors">
                    ← BACK TO HOME
                </Link>
            </div>

            <div className="w-full max-w-md">
                <div className="flex items-center justify-center mb-8">
                    <Shield className="w-12 h-12 text-accent mr-4" />
                    <h1 className="text-4xl font-heading font-bold text-dark tracking-tight">CIVILIAN<br /><span className="font-drama font-normal italic text-accent">Portal</span></h1>
                </div>

                <div className="bg-white border border-dark/10 p-8 rounded-[2rem] shadow-xl">
                    <h2 className="font-data text-sm text-dark/60 mb-6 uppercase tracking-widest border-b border-dark/10 pb-4 flex justify-between">
                        <span>Secure Access</span>
                        <span className="text-alert-green">● PROTECTED</span>
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block font-heading text-sm font-bold text-dark mb-2 uppercase">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-background border-2 border-dark/10 rounded-xl px-4 py-3 text-dark font-data focus:outline-none focus:border-accent transition-colors"
                                placeholder="citizen@email.com"
                            />
                        </div>

                        <div>
                            <label className="block font-heading text-sm font-bold text-dark mb-2 uppercase">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-background border-2 border-dark/10 rounded-xl px-4 py-3 text-dark font-data focus:outline-none focus:border-accent transition-colors"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <button type="submit" className="w-full bg-accent text-white py-4 mt-4 rounded-xl font-heading text-sm font-bold uppercase tracking-widest hover:bg-accent/90 transition-colors group">
                            <span className="flex items-center justify-center">
                                ACCESS PORTAL
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>

                        <button type="button" onClick={() => navigate('/responder-login')} className="w-full bg-transparent border border-dark/20 text-dark py-4 mt-4 rounded-xl font-heading text-sm font-bold uppercase tracking-widest hover:border-accent hover:text-accent transition-colors">
                            RESPONDER ACCESS
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs font-data text-dark/40">
                        PUBLIC CIVILIAN ACCESS PORTAL
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginCivilian;

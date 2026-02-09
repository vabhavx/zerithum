'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';
import {
    Loader2,
    Mail,
    Lock,
    User,
    AlertCircle,
    CheckCircle,
    ChevronLeft,
    Grid2x2Plus,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import ShaderBackground from './shader-background';

interface AuthPageProps {
    initialMode?: 'signin' | 'signup';
}

export function AuthPage({ initialMode = 'signin' }: AuthPageProps) {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const toggleMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setError(null);
        setSuccess(false);
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsGoogleLoading(true);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/Dashboard`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setIsGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                if (error) throw error;

                if (data.user && !data.session) {
                    setSuccess(true);
                } else {
                    toast.success('Account created successfully!');
                    navigate('/Dashboard');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                toast.success('Logged in successfully!');
                navigate('/Dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <main className="relative flex min-h-screen flex-col justify-center p-4 bg-background">
                 <div className="mx-auto w-full max-w-md space-y-6 text-center">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-primary/10 p-4">
                            <CheckCircle className="size-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Check your email</h1>
                    <p className="text-muted-foreground">
                        We&apos;ve sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                        Click the link to activate your account.
                    </p>
                    <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
                        Back to Login
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
            <div className="relative hidden h-full flex-col p-10 lg:flex overflow-hidden">
                <ShaderBackground />
                <div className="z-10 flex items-center gap-2 text-white">
                    <Grid2x2Plus className="size-6" />
                    <p className="text-xl font-semibold">Zerithum</p>
                </div>
            </div>
            <div className="relative flex min-h-screen flex-col justify-center p-4 bg-background">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate contain-strict -z-10 opacity-60 pointer-events-none"
                >
                    <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full" />
                    <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
                    <div className="bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full" />
                </div>
                <Button variant="ghost" className="absolute top-7 left-5" asChild>
                    <Link to="/">
                        <ChevronLeft className='size-4 me-2' />
                        Home
                    </Link>
                </Button>
                <div className="mx-auto space-y-4 w-full max-w-sm">
                    <div className="flex items-center gap-2 lg:hidden">
                        <Grid2x2Plus className="size-6" />
                        <p className="text-xl font-semibold">Zerithum</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <h1 className="font-heading text-2xl font-bold tracking-wide">
                            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                        </h1>
                        <p className="text-muted-foreground text-base">
                            {mode === 'signin'
                                ? 'Enter your email to sign in to your account'
                                : 'Enter your email to create your account'}
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-destructive text-sm">
                            <AlertCircle className="size-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Button
                            type="button"
                            size="lg"
                            className="w-full"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading || isLoading}
                        >
                            {isGoogleLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <GoogleIcon className='size-4 me-2' />
                            )}
                            Continue with Google
                        </Button>
                    </div>

                    <AuthSeparator />

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <div className="relative h-max">
                                    <Input
                                        placeholder="Full Name"
                                        className="peer ps-9"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                        <User className="size-4" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="relative h-max">
                                <Input
                                    placeholder="name@example.com"
                                    className="peer ps-9"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                    <Mail className="size-4" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="relative h-max">
                                <Input
                                    placeholder="Password"
                                    className="peer ps-9"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                    <Lock className="size-4" aria-hidden="true" />
                                </div>
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <div className="relative h-max">
                                    <Input
                                        placeholder="Confirm Password"
                                        className="peer ps-9"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                                        <Lock className="size-4" aria-hidden="true" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="font-medium text-primary hover:underline underline-offset-4"
                            disabled={isLoading}
                        >
                            {mode === 'signin' ? 'Sign up' : 'Sign in'}
                        </button>
                    </div>

                    <p className="text-muted-foreground text-center text-xs px-8">
                        By clicking continue, you agree to our{' '}
                        <a
                            href="#"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                            href="#"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </main>
    );
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <g>
            <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
        </g>
    </svg>
);

const AuthSeparator = () => {
    return (
        <div className="flex w-full items-center justify-center">
            <div className="bg-border h-px w-full" />
            <span className="text-muted-foreground px-2 text-xs">OR</span>
            <div className="bg-border h-px w-full" />
        </div>
    );
};

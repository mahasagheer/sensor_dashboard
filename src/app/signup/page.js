"use client"
import { signup } from './actions';
import { Lock, Mail, User, ArrowRight,File,Users,Building } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-purple-500/5">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-float-delay"></div>
      </div>

      <div className="relative w-full max-w-md px-6 py-12">
        <div className="bg-background/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-primary/10">
          <div className="p-8">
            <div className="flex justify-center mb-8">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <User className="h-8 w-8" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Get started with your account
            </p>

            <form className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-muted-foreground/20 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-muted-foreground/20 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Create a password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-muted-foreground/20 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <button
                  formAction={signup}
                  className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white font-medium hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Log in
                  </Link>
                </div>
              </div>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 py-4 bg-muted/20 border-t border-muted-foreground/10 text-center">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
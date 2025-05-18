
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to save user profile to backend
  const saveUserProfile = async (user: User) => {
    try {
      // Get API URL from environment or use default
      const apiUrl = import.meta.env.VITE_API_URL || 'https://anex-mumbai-backend.onrender.com/api';

      // Extract user data
      const userData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      };

      // Save to backend
      await axios.post(`${apiUrl}/user-profile`, userData);
      console.log('User profile saved successfully');
    } catch (error) {
      console.error('Error saving user profile:', error);
      // Don't throw - we don't want to interrupt the auth flow
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          // Save user profile data to our backend
          await saveUserProfile(session.user);

          // Navigate to home page (Web Scraper)
          navigate('/');
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // If we have a session, save the user profile
      if (session?.user) {
        await saveUserProfile(session.user);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signInWithGoogle = async () => {
    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Error signing in with Google:', error.message);
        toast({
          title: "Authentication Error",
          description: error.message === "provider is not enabled" ?
            "Google authentication is not enabled in the Supabase project. Please enable it in the Supabase dashboard." :
            error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (!data.url) {
        toast({
          title: "Authentication Error",
          description: "Could not generate authentication URL. Please try again later.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast({
        title: "Error Signing Out",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signInWithGoogle, signOut }}>
      {loading ? (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

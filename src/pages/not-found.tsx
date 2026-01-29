import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-bold font-display text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          Oops! The page you're looking for seems to have wandered off.
        </p>

        <div className="pt-4">
          <Link href="/" className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

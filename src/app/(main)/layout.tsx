import Link from "next/link";
import { Button } from "@/components/Button";
import { User, Dumbbell, Search } from "lucide-react";
import { ModeToggle } from "@/components/ModeSwitcher";
import { Input } from "@/components/ui/input";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full glass">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center space-x-2 transition-all duration-300 hover:scale-105 shrink-0">
            <Dumbbell className="h-6 w-6 text-primary transition-colors duration-300" />
            <span className="hidden font-bold sm:inline-block text-lg tracking-tight transition-colors duration-300">MyGym</span>
          </Link>

          <div className="flex-1 max-w-md mx-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search workouts, people..." 
                className="pl-10 w-full bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-background transition-all duration-300 rounded-full"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <ModeToggle />
             <Link href="/profile">
               <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
               </Button>
             </Link>
          </div>
        </div>
      </header>
      <main className="container py-8">
        {children}
      </main>
    </>
  );
}
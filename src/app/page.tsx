import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <Header />
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-16 md:py-24 bg-gradient-to-b from-background to-muted">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight mb-6">
            Manage Your Leads with Ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A simple, mini CRM system to track and nurture your leads. 
            Stay organized and boost your sales with our intuitive interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2 rounded-xl">
              <Link href="/leads">
                <Eye className="h-5 w-5" />
                View Leads
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
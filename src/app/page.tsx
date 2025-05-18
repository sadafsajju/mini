import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import dynamic from 'next/dynamic';

// Import the grid background as a client component
const GridBackground = dynamic(
  () => import('@/components/ui/animations/GridBackground'),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="flex flex-col h-screen relative">
      <GridBackground />
      <Header />
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-16 md:py-24 bg-transparent">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight mb-6">
            Manage Your <span className='text-green-600'>Leads</span> with Ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A simple, mini CRM system to track and nurture your leads. 
            Stay organized and boost your sales with our intuitive interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant={'secondary'} asChild size="lg" className="gap-2 rounded-xl shadow-green-950 shadow-xl text-white bg-green-700 hover:bg-green-800">
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
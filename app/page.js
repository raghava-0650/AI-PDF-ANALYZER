import Hero from './_component/Hero';
import HomePageHeader from './_component/HomePageHeader';

export default function Home() {
  return (
    <div className="min-h-screen">
      <HomePageHeader />
      <Hero />
    </div>
  );
}

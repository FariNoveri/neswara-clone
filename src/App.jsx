import React from "react";
import Navbar from "./component/navbar";
import NewsSection from "./component/newssection";
import Hero from "./component/hero";
import HeroSection from "./component/herosection";
import LiveNewsSection from "./component/livenewsection";
import LatestNewsSection from "./component/latestnewsection";
import Footer from "./component/footer";
import Article from "./component/newsarticle";

function App() {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <Navbar />
      <NewsSection />
      <Hero />
      <HeroSection />
      <Article />
      <LiveNewsSection />
      <LatestNewsSection/>
      <Footer />
    </div>
  );
}

export default App;

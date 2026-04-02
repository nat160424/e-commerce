import React from "react";
import Hero from "../components/Hero";
import LatestCollections from "../components/LatestCollections";
import BestSellerProducts from "../components/BestSellerProducts";
import PolicyFeatures from "../components/PolicyFeatures";
import Testimonials from "../components/Testimonials";
import RecentOrdersCarousel from "../components/RecentOrdersCarousel";

const Home = () => {
  return (
    <div>
      <Hero />
      <LatestCollections />
      <BestSellerProducts />
      <PolicyFeatures />
      <Testimonials />

      {/* Social-proof ticker — API response leaks order_id, user_id, shipment_id */}
      <RecentOrdersCarousel />
    </div>
  );
};

export default Home;
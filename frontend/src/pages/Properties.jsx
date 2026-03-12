import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const properties = [
  { id: 1, title: 'Ocean Wave', location: 'Vancouver, BC', type: 'Residential', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', price: '$3,200/mo' },
  { id: 2, title: 'Puzzle Tower', location: 'Downtown', type: 'Commercial', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600', price: '$4,500/mo' },
  { id: 3, title: 'Honey Comb', location: 'Kitsilano', type: 'Residential', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600', price: '$2,800/mo' },
  { id: 4, title: 'Yellow Suites', location: 'Yaletown', type: 'Luxury', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', price: '$5,200/mo' },
  { id: 5, title: 'West End Living', location: 'West End', type: 'Apartment', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', price: '$2,400/mo' },
  { id: 6, title: 'Gastown Loft', location: 'Gastown', type: 'Loft', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', price: '$3,100/mo' },
  { id: 7, title: 'Coal Harbour View', location: 'Coal Harbour', type: 'Penthouse', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600', price: '$5,800/mo' },
  { id: 8, title: 'Mt Pleasant Studio', location: 'Mt Pleasant', type: 'Studio', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', price: '$1,650/mo' },
  { id: 9, title: 'Fairview Duplex', location: 'Fairview', type: 'Duplex', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600', price: '$3,800/mo' },
  { id: 10, title: 'Kerrisdale Manor', location: 'Kerrisdale', type: 'House', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600', price: '$4,200/mo' },
  { id: 11, title: 'Olympic Village', location: 'Olympic Village', type: 'Condo', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', price: '$2,900/mo' },
  { id: 12, title: 'Shaughnessy Estate', location: 'Shaughnessy', type: 'Luxury', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', price: '$8,500/mo' },
  { id: 13, title: 'Strathcona Arts', location: 'Strathcona', type: 'Loft', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600', price: '$2,200/mo' },
  { id: 14, title: 'Commercial Drive', location: 'The Drive', type: 'Apartment', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600', price: '$1,900/mo' },
  { id: 15, title: 'South Granville', location: 'S. Granville', type: 'Townhouse', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600', price: '$3,500/mo' },
  { id: 16, title: 'Point Grey Home', location: 'Point Grey', type: 'House', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600', price: '$4,800/mo' },
  { id: 17, title: 'Marpole Retreat', location: 'Marpole', type: 'Residential', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600', price: '$2,100/mo' },
  { id: 18, title: 'Dunbar Classic', location: 'Dunbar', type: 'House', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600', price: '$3,900/mo' },
  { id: 19, title: 'Main St Modern', location: 'Main Street', type: 'Condo', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', price: '$2,600/mo' },
  { id: 20, title: 'Hastings Sunrise', location: 'Hastings', type: 'Apartment', image: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=600', price: '$1,800/mo' },
];

const Properties = () => {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] py-16 px-4" data-testid="properties-hero">
        <div className="max-w-6xl mx-auto text-center text-white">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-4">Properties</p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Featured Listings</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Discover your perfect home from our curated selection
          </p>
          <Link to="/browse" className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white text-[#1A2F3A] font-medium hover:bg-gray-100 transition-colors">
            <Search size={18} />
            Browse All Properties
          </Link>
        </div>
      </section>

      {/* Properties Grid - 5 columns */}
      <section className="section-lg bg-[#F5F5F0]" data-testid="properties-grid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {properties.map((property) => (
              <Link
                key={property.id}
                to="/browse"
                className="relative rounded-2xl overflow-hidden h-[240px] property-card group"
                data-testid={`property-card-${property.id}`}
              >
                <img 
                  src={property.image}
                  alt={property.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-white/70 uppercase tracking-wider">{property.type}</span>
                    <span className="text-[10px] text-white/50">•</span>
                    <span className="text-[10px] text-white/70">{property.location}</span>
                  </div>
                  <h2 className="text-lg text-white mb-1 truncate" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {property.title}
                  </h2>
                  <p className="text-white/90 text-sm font-medium">{property.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Properties;

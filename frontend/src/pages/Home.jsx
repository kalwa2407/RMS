import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Award, Clock, Star } from 'lucide-react';
import { menuItems, features } from '../mockData';

const Home = () => {
  const signatureDishes = menuItems.filter(item => item.popular).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#184956] to-[#0f2933]">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(15, 41, 51, 0.85), rgba(15, 41, 51, 0.85)), url(https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070&auto=format&fit=crop)'
        }}
      >
        <div className="text-center text-white px-4 max-w-4xl mx-auto fade-in-up">
          <div className="mb-8">
            <div className="inline-block border border-[#EAB308] rounded-full px-6 py-2">
              <p className="text-[#EAB308] text-base font-medium">
                Irani Café • Persian Cuisine • Royal Dining
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome to <span className="text-[#EAB308]">Persian Darbar</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Where tradition meets taste. Experience authentic Persian culture with artisan cuisine and flavorful delicacies in the heart of Pune.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu">
              <button className="bg-[#EAB308] hover:bg-[#CA8A04] text-black px-8 py-3 text-base font-bold rounded-full transition-all duration-300">
                View Our Menu
              </button>
            </Link>
            <Link to="/reservation">
              <button className="bg-transparent border-2 border-[#EAB308] hover:bg-[#EAB308] hover:text-black text-[#EAB308] px-8 py-3 text-base font-bold rounded-full transition-all duration-300">
                Reserve a Table
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Golden Border */}
      <div className="golden-divider"></div>

      {/* Features Section */}
      <section className="py-20 bg-[#1a4855] persian-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const icons = [ChefHat, Award, Clock, Star];
              const Icon = icons[index];
              return (
                <div key={feature.id} className="bg-[#0f2933] rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 card-hover">
                  <div className="w-16 h-16 bg-[#1a4855] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-[#EAB308]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Golden Border */}
      <div className="golden-divider"></div>

      {/* Signature Dishes Section */}
      <section className="py-20 bg-[#0f2933]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-[#EAB308] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Signature Dishes
            </h2>
            <p className="text-lg text-gray-300">
              Taste the royal flavors of Persia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {signatureDishes.map((dish) => (
              <div key={dish.id} className="bg-[#1a4855] rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 card-hover">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#EAB308] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{dish.name}</h3>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">{dish.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-[#EAB308]">₹{dish.price}</span>
                    <Link to="/order">
                      <button className="bg-[#EAB308] hover:bg-[#CA8A04] text-black px-6 py-2 rounded-full font-bold transition-all duration-300">
                        Order Now
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/menu">
              <button className="bg-transparent border-2 border-[#EAB308] hover:bg-[#EAB308] hover:text-black text-[#EAB308] px-10 py-3 rounded-full font-bold transition-all duration-300">
                Explore Full Menu
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Golden Border */}
      <div className="golden-divider"></div>

      {/* CTA Section */}
      <section className="py-20 bg-[#1a4855] persian-pattern">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#EAB308] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Ready to Experience Royal Persian Dining?
          </h2>
          <p className="text-lg mb-8 text-gray-300">
            Book your table or order online for a memorable culinary journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/reservation">
              <button className="bg-[#EAB308] hover:bg-[#CA8A04] text-black px-10 py-3 text-base font-bold rounded-full transition-all duration-300">
                Book a Table
              </button>
            </Link>
            <Link to="/order">
              <button className="bg-transparent border-2 border-[#EAB308] hover:bg-[#EAB308] hover:text-black text-[#EAB308] px-10 py-3 text-base font-bold rounded-full transition-all duration-300">
                Order Online
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

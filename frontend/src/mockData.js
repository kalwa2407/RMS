// Mock data for Taste of Hindustan

export const restaurantInfo = {
  name: "Taste of Hindustan",
  tagline: "Heart of Bharat · Since 1978",
  description: "Experience the royal heritage of India. From aromatic biryanis to succulent kebabs, we bring the authentic soul of Hindustan to your plate in the heart of Pune.",
  address: "Upper Ground Floor, Renaissance Business Wellesley Road, Camp Area, Pune",
  phone: "+919175623047",
  email: "info@persiandarbar.com",
  hours: "10:00 AM - 2:00 AM (Daily)",
  rating: 4.4,
  totalReviews: 2561
};

export const features = [
  {
    id: 1,
    title: "Expert Chefs",
    description: "Traditional Persian recipes passed down through generations"
  },
  {
    id: 2,
    title: "Quality Food",
    description: "Premium ingredients sourced daily for authentic taste"
  },
  {
    id: 3,
    title: "Fast Service",
    description: "Quick delivery & efficient dine-in experience"
  },
  {
    id: 4,
    title: "Hindustani Heritage",
    description: "Authentic Indian ambiance and royal hospitality"
  }
];

export const menuCategories = [
  "All",
  "Biryani",
  "Kebabs",
  "Mughlai",
  "Starters",
  "Main Course",
  "Breads",
  "Desserts",
  "Beverages"
];

export const menuItems = [
  // Biryani
  {
    id: 1,
    name: "Chicken Biryani",
    category: "Biryani",
    description: "Fragrant basmati rice with succulent chicken pieces, aromatic spices",
    price: 380,
    image: "https://images.unsplash.com/photo-1701579231305-d7d8af9a3fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pfGVufDB8fHx8MTc2MzA5NDkyN3ww&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 2,
    name: "Mutton Persian Special Biryani",
    category: "Biryani",
    description: "Premium mutton pieces cooked with Persian spices and saffron-infused rice",
    price: 650,
    image: "https://images.unsplash.com/photo-1701579231349-d7459c40919d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxiaXJ5YW5pfGVufDB8fHx8MTc2MzA5NDkyN3ww&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 3,
    name: "Fish Biryani",
    category: "Biryani",
    description: "Fresh fish pieces layered with aromatic rice (6 pieces)",
    price: 445,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxiaXJ5YW5pfGVufDB8fHx8MTc2MzA5NDkyN3ww&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  {
    id: 4,
    name: "Prawns Biryani",
    category: "Biryani",
    description: "Juicy prawns cooked with fragrant basmati rice",
    price: 645,
    image: "https://images.unsplash.com/photo-1701579231305-d7d8af9a3fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pfGVufDB8fHx8MTc2MzA5NDkyN3ww&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  {
    id: 5,
    name: "Pomfret Biryani",
    category: "Biryani",
    description: "Whole pomfret fish with aromatic spices and rice",
    price: 645,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxiaXJ5YW5pfGVufDB8fHx8MTc2MzA5NDkyN3ww&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  // Kebabs
  {
    id: 6,
    name: "Chicken Tandoori Mumtaz",
    category: "Kebabs",
    description: "Marinated chicken grilled to perfection in tandoor",
    price: 495,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxrZWJhYnxlbnwwfHx8fDE3NjMyMDcyMjB8MA&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 7,
    name: "Chicken Afghani Kebab",
    category: "Kebabs",
    description: "Creamy Afghan-style chicken kebabs (6 pieces)",
    price: 645,
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxrZWJhYnxlbnwwfHx8fDE3NjMyMDcyMjB8MA&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 8,
    name: "Chicken Nawabi Kebab",
    category: "Kebabs",
    description: "Royal style chicken kebabs with rich spices (6 pieces)",
    price: 675,
    image: "https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg",
    popular: false,
    available: true
  },
  {
    id: 9,
    name: "Chicken Special Mix Tikka",
    category: "Kebabs",
    description: "Assorted chicken tikka varieties (6 pieces)",
    price: 645,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxrZWJhYnxlbnwwfHx8fDE3NjMyMDcyMjB8MA&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  {
    id: 10,
    name: "Irani Kebab Platter",
    category: "Kebabs",
    description: "Mixed Persian kebab platter with various meats",
    price: 795,
    image: "https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg",
    popular: true,
    available: true
  },
  // Mughlai
  {
    id: 11,
    name: "Mutton Rogan Josh",
    category: "Mughlai",
    description: "Tender mutton in rich aromatic Persian gravy",
    price: 450,
    image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxNdWdobGFpJTIwY3Vycnl8ZW58MHx8fHwxNzYzMjA3MjI1fDA&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 12,
    name: "Chicken Mughlai",
    category: "Mughlai",
    description: "Classic Mughlai chicken curry with cream and nuts",
    price: 380,
    image: "https://images.unsplash.com/photo-1627366422957-3efa9c6df0fc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxNdWdobGFpJTIwY3Vycnl8ZW58MHx8fHwxNzYzMjA3MjI1fDA&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 13,
    name: "Mutton Korma",
    category: "Mughlai",
    description: "Slow-cooked mutton in rich creamy gravy",
    price: 475,
    image: "https://images.unsplash.com/photo-1606471191009-63994c53433b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxNdWdobGFpJTIwY3Vycnl8ZW58MHx8fHwxNzYzMjA3MjI1fDA&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  {
    id: 14,
    name: "Chicken Jahangiri",
    category: "Mughlai",
    description: "Royal chicken preparation with exotic spices",
    price: 395,
    image: "https://images.unsplash.com/photo-1627366422957-3efa9c6df0fc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxNdWdobGFpJTIwY3Vycnl8ZW58MHx8fHwxNzYzMjA3MjI1fDA&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  // Starters
  {
    id: 15,
    name: "Chicken 65",
    category: "Starters",
    description: "Spicy fried chicken appetizer",
    price: 285,
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxrZWJhYnxlbnwwfHx8fDE3NjMyMDcyMjB8MA&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 16,
    name: "Paneer Tikka",
    category: "Starters",
    description: "Grilled cottage cheese with bell peppers",
    price: 295,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxrZWJhYnxlbnwwfHx8fDE3NjMyMDcyMjB8MA&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  // Desserts
  {
    id: 17,
    name: "Shahi Tukda",
    category: "Desserts",
    description: "Royal bread pudding with saffron and dry fruits",
    price: 180,
    image: "https://images.unsplash.com/photo-1617622163466-d1d56ec8b127?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxJbmRpYW4lMjBkZXNzZXJ0c3xlbnwwfHx8fDE3NjMyMDcyMzF8MA&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 18,
    name: "Gulab Jamun",
    category: "Desserts",
    description: "Classic Indian sweet dumplings in sugar syrup",
    price: 120,
    image: "https://images.pexels.com/photos/8819769/pexels-photo-8819769.jpeg",
    popular: true,
    available: true
  },
  {
    id: 19,
    name: "Kheer",
    category: "Desserts",
    description: "Traditional rice pudding with cardamom",
    price: 150,
    image: "https://images.unsplash.com/photo-1617622163466-d1d56ec8b127?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxJbmRpYW4lMjBkZXNzZXJ0c3xlbnwwfHx8fDE3NjMyMDcyMzF8MA&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  },
  // Beverages
  {
    id: 20,
    name: "Irani Chai",
    category: "Beverages",
    description: "Traditional Persian tea",
    price: 60,
    image: "https://images.unsplash.com/photo-1592861956120-e524fc739696?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZGluaW5nfGVufDB8fHx8MTc2MzE3MTA0NHww&ixlib=rb-4.1.0&q=85",
    popular: true,
    available: true
  },
  {
    id: 21,
    name: "Fresh Lime Soda",
    category: "Beverages",
    description: "Refreshing lime soda",
    price: 80,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxyZXN0YXVyYW50JTIwZGluaW5nfGVufDB8fHx8MTc2MzE3MTA0NHww&ixlib=rb-4.1.0&q=85",
    popular: false,
    available: true
  }
];

export const galleryImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1572471553554-bc9917e51ed3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxQZXJzaWFuJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3NjMyMDcyMTB8MA&ixlib=rb-4.1.0&q=85",
    caption: "Elegant Persian Dining"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1592861956120-e524fc739696?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZGluaW5nfGVufDB8fHx8MTc2MzE3MTA0NHww&ixlib=rb-4.1.0&q=85",
    caption: "Traditional Ambiance"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1667388968964-4aa652df0a9b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHxyZXN0YXVyYW50JTIwZGluaW5nfGVufDB8fHx8MTc2MzE3MTA0NHww&ixlib=rb-4.1.0&q=85",
    caption: "Cozy Interior"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxyZXN0YXVyYW50JTIwZGluaW5nfGVufDB8fHx8MTc2MzE3MTA0NHww&ixlib=rb-4.1.0&q=85",
    caption: "Food Presentation"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxyZXN0YXVyYW50JTIwZGluaW5nfGVufDB8fHx8MTc2MzE3MTA0NHww&ixlib=rb-4.1.0&q=85",
    caption: "Table Setting"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1701579231305-d7d8af9a3fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxiaXJ5YW5pfGVufDB8fHx8MTc2MzA5NDkyN3ww&ixlib=rb-4.1.0&q=85",
    caption: "Signature Biryani"
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxrZWJhYnxlbnwwfHx8fDE3NjMyMDcyMjB8MA&ixlib=rb-4.1.0&q=85",
    caption: "Kebab Platter"
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1606471191009-63994c53433b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxNdWdobGFpJTIwY3Vycnl8ZW58MHx8fHwxNzYzMjA3MjI1fDA&ixlib=rb-4.1.0&q=85",
    caption: "Mughlai Delicacy"
  }
];

export const reviews = [
  {
    id: 1,
    name: "Soumya Mishra",
    rating: 5,
    date: "13 days ago",
    text: "Nafis Ali provided excellent service at Taste of Hindustan. He was courteous, attentive, and ensured a pleasant dining experience throughout. Truly professional and warm in his approach. The food quality was outstanding!"
  },
  {
    id: 2,
    name: "Rahul Sharma",
    rating: 5,
    date: "1 month ago",
    text: "Best biryani in Pune! The mutton was so tender and the rice was perfectly cooked. The ambiance is great and staff is very courteous. Will definitely visit again."
  },
  {
    id: 3,
    name: "Priya Desai",
    rating: 4,
    date: "2 months ago",
    text: "Loved the kebabs! Chicken Afghani was amazing. Service was quick and the portions were generous. Slightly on the pricier side but worth it for the quality."
  },
  {
    id: 4,
    name: "Amit Patel",
    rating: 5,
    date: "2 months ago",
    text: "A hidden gem in Camp area! The Taste of Hindustan special biryani is a must-try. The flavors are authentic and remind me of traditional royal kitchens. Highly recommended!"
  },
  {
    id: 5,
    name: "Sneha Kulkarni",
    rating: 5,
    date: "3 months ago",
    text: "Celebrated my birthday here and had an amazing experience. The staff decorated the table and the food was delicious. Special mention to their Shahi Tukda - absolutely divine!"
  }
];

export const mockOrders = [];
export const mockReservations = [];

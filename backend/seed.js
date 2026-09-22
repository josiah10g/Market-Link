const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');
const { createTablesSQL } = require('./migrate');

async function seed() {
  console.log('[SEED] Starting MarketLink database seeding...');
  const client = await pool.connect();

  try {
    // 1. Ensure tables exist
    await client.query(createTablesSQL);

    // 2. Clear existing demo data cleanly
    await client.query('TRUNCATE TABLE reviews, order_items, orders, notifications, products, vendors, users RESTART IDENTITY CASCADE;');

    // 3. Password hashes
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('password123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    // 4. Create Users (Admin, Customer, Vendors)
    const usersSQL = `
      INSERT INTO users (name, email, password_hash, phone, role) VALUES
      ('Admin User', 'admin@marketlink.com', $1, '08012340001', 'admin'),
      ('Josiah Adewale', 'josiah@marketlink.com', $2, '08098765432', 'customer'),
      ('Amaka Eze', 'amaka@marketlink.com', $2, '08023456789', 'vendor'),
      ('Tunde Balogun', 'tunde@marketlink.com', $2, '08034567890', 'vendor'),
      ('Bella Okoro', 'bella@marketlink.com', $2, '08045678901', 'vendor'),
      ('FixIt Repairs', 'fixit@marketlink.com', $2, '08056789012', 'vendor'),
      ('Chidi Okafor', 'chidi@marketlink.com', $2, '08067890123', 'vendor'),
      ('Ngozi Bakehouse', 'ngozi@marketlink.com', $2, '08078901234', 'vendor'),
      ('Elegance Hair', 'elegance@marketlink.com', $2, '08089012345', 'vendor')
      RETURNING id, name, email, role;
    `;
    const userRes = await client.query(usersSQL, [adminPasswordHash, demoPasswordHash]);
    const users = userRes.rows;

    const adminUser = users.find(u => u.role === 'admin');
    const josiah = users.find(u => u.email === 'josiah@marketlink.com');
    const amakaUser = users.find(u => u.email === 'amaka@marketlink.com');
    const tundeUser = users.find(u => u.email === 'tunde@marketlink.com');
    const bellaUser = users.find(u => u.email === 'bella@marketlink.com');
    const fixitUser = users.find(u => u.email === 'fixit@marketlink.com');
    const chidiUser = users.find(u => u.email === 'chidi@marketlink.com');
    const ngoziUser = users.find(u => u.email === 'ngozi@marketlink.com');
    const eleganceUser = users.find(u => u.email === 'elegance@marketlink.com');

    // 5. Create Vendors (matching mockup screenshot stats and names)
    const vendorsSQL = `
      INSERT INTO vendors (user_id, business_name, description, category, phone, address, city, status, rating, rating_count, total_orders) VALUES
      ($1, 'Amaka''s Kitchen', 'Authentic Nigerian party jollof, soups, fried rice and local delicacies made fresh daily in Abuja.', 'Food', '08023456789', 'Suite 14, Wuse II Plaza', 'Abuja', 'approved', 4.8, 96, 248),
      ($2, 'Tunde Bespoke Tailors', 'Handcrafted traditional Agbada, Senator suits, and custom modern fits crafted with premium fabrics.', 'Fashion', '08034567890', 'Plot 42, Garki Area 11', 'Abuja', 'approved', 4.9, 42, 98),
      ($3, 'Bella Beauty Lounge', 'Professional hairstyling, gele tying, bridal makeover, and manicure services for special events.', 'Beauty', '08045678901', 'Shop 7, Jabi Lake Mall', 'Abuja', 'approved', 4.6, 28, 64),
      ($4, 'FixIt Phone Repairs', 'Express screen replacements, battery repairs, micro-soldering, and certified diagnostics.', 'Repairs', '08056789012', 'Banex Plaza, Wuse II', 'Abuja', 'approved', 4.9, 74, 182),
      ($5, 'Chidi''s Snack Hub', 'Crispy puff-puff, meat pies, spring rolls, samosa platters, and fresh zobo drinks for events.', 'Food', '08067890123', 'Ahmadu Bello Way, Central Area', 'Abuja', 'suspended', 3.2, 12, 31),
      ($6, 'Ngozi''s Bake House', 'Artisanal custom cakes, pastries, gourmet cupcakes, and celebration platters.', 'Food', '08078901234', 'Maitama Shopping Complex', 'Abuja', 'pending', NULL, 0, 0),
      ($7, 'Elegance Hair Studio', 'Luxury wig installations, braid styles, and natural hair treatments.', 'Beauty', '08089012345', 'Gwarinpa Estate', 'Abuja', 'pending', NULL, 0, 0)
      RETURNING *;
    `;
    const vendorRes = await client.query(vendorsSQL, [
      amakaUser.id,
      tundeUser.id,
      bellaUser.id,
      fixitUser.id,
      chidiUser.id,
      ngoziUser.id,
      eleganceUser.id
    ]);
    const vendors = vendorRes.rows;

    const amaka = vendors.find(v => v.business_name === "Amaka's Kitchen");
    const tunde = vendors.find(v => v.business_name === 'Tunde Bespoke Tailors');
    const bella = vendors.find(v => v.business_name === 'Bella Beauty Lounge');
    const fixit = vendors.find(v => v.business_name === 'FixIt Phone Repairs');
    const chidi = vendors.find(v => v.business_name === "Chidi's Snack Hub");

    // 6. Create Products (Matching items from mockups with lead_times)
    const productsSQL = `
      INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, lead_time, image_url) VALUES
      ($1, 'Party Jollof Rice (Large)', 'Smoky party jollof served with fried plantain, salad, and choice of protein.', 4500.00, 'Meals', 4, '20 min prep', 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=500&q=80'),
      ($1, 'Fried Rice + Chicken', 'Savory fried rice packed with fresh veggies, diced liver, and crispy peppered chicken.', 5200.00, 'Meals', 8, '25 min prep', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80'),
      ($1, 'Puff-Puff Box (15 pcs)', 'Golden brown, fluffy, traditional sweet Nigerian puff-puff dusted with sugar.', 1200.00, 'Snacks', 3, '15 min prep', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&q=80'),
      ($1, 'Egusi Soup & Pounded Yam', 'Rich melon seed soup prepared with smoked fish, stockfish, assorted meat and hot pounded yam.', 6000.00, 'Meals', 6, '30 min prep', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'),
      
      ($2, 'Custom Agbada — Navy Blue', '3-piece grand Agbada tailored with high-grade Cashmere wool and bespoke embroidery.', 35000.00, 'Traditional', 5, 'Made to order (3 days)', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&q=80'),
      ($2, 'Senator Suit — Charcoal Grey', 'Crisp bespoke 2-piece modern Senator attire with minimalist chest piping and custom cuff links.', 28000.00, 'Suits', 7, 'Made to order (2 days)', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=500&q=80'),
      ($2, 'African Print Kaftan', 'Comfortable vibrant Ankara/Wax print kaftan designed for casual weekend outings.', 18500.00, 'Casual', 10, 'Made to order (2 days)', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&q=80'),

      ($3, 'Gele Styling Session', 'Intricate avant-garde or traditional Infinity Gele tying with accessories provided.', 6000.00, 'Hairstyling', 15, '45 min session', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80'),
      ($3, 'Bridal Glam Makeup', 'Full HD long-wear bridal contouring, mink lash application, and lip artistry.', 25000.00, 'Makeup', 8, 'Book a slot', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&q=80'),
      ($3, 'Luxury Gel Manicure & Pedicure', 'Cuticle treatment, organic sugar scrub massage, and UV gel polish coating.', 9500.00, 'Nails', 12, '1 hr session', 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&q=80'),

      ($4, 'Phone Screen Replacement (iPhone 12)', 'Original OLED display replacement with true-tone calibration and 90-day warranty.', 12000.00, 'Screens', 5, 'Same-Day (1 hr)', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&q=80'),
      ($4, 'Battery Replacement Service', 'High-capacity battery swap for Samsung and iPhone models restoring 100% health.', 8500.00, 'Batteries', 9, 'Same-Day (30 min)', 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&q=80'),
      ($4, 'Charging Port Micro-Soldering', 'Precision motherboard repair for damaged USB-C / Lightning ports.', 7000.00, 'Hardware', 4, 'Same-Day (2 hrs)', 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&q=80'),

      ($5, 'Small Chops Pack (Party Platter)', '10 samosas, 10 spring rolls, 20 puff-puff, 5 peppered gizzard skewers.', 7500.00, 'Snacks', 14, '25 min prep', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80'),
      ($5, 'Chilled Hibiscus Zobo (1L)', 'Infused with cloves, ginger, pineapple peel, and natural sweet orange.', 1500.00, 'Drinks', 20, 'Instant', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80')
      RETURNING *;
    `;
    const prodRes = await client.query(productsSQL, [
      amaka.id,
      tunde.id,
      bella.id,
      fixit.id,
      chidi.id
    ]);
    const products = prodRes.rows;

    const jollof = products.find(p => p.name.includes('Party Jollof'));
    const friedRice = products.find(p => p.name.includes('Fried Rice'));
    const agbada = products.find(p => p.name.includes('Custom Agbada'));
    const gele = products.find(p => p.name.includes('Gele Styling'));
    const phoneScreen = products.find(p => p.name.includes('Phone Screen'));
    const smallChops = products.find(p => p.name.includes('Small Chops'));

    // 7. Seed Orders matching screenshot orders (#ML-3312, #ML-3311, #ML-3309, #ML-3306, #ML-3302)
    const ordersSQL = `
      INSERT INTO orders (order_code, customer_id, vendor_id, total_amount, status, payment_status, payment_method, delivery_address, notes, created_at) VALUES
      ('ML-3312', $1, $2, 9000.00, 'pending', 'pay_on_delivery', 'pay_on_delivery', 'Plot 204, Garki II, Abuja', 'Extra pepper sauce please', NOW() - INTERVAL '12 minutes'),
      ('ML-3311', $1, $2, 5200.00, 'in_progress', 'paid', 'card', 'Plot 204, Garki II, Abuja', 'Deliver to reception', NOW() - INTERVAL '40 minutes'),
      ('ML-3309', $1, $3, 35000.00, 'accepted', 'paid', 'transfer', 'Plot 204, Garki II, Abuja', 'Fabric measurements provided', NOW() - INTERVAL '1 hour'),
      ('ML-3306', $1, $4, 12000.00, 'ready', 'pay_on_delivery', 'pay_on_delivery', 'Plot 204, Garki II, Abuja', 'Ready for pickup at Banex', NOW() - INTERVAL '2 hours'),
      ('ML-3302', $1, $5, 6000.00, 'completed', 'paid', 'card', 'Plot 204, Garki II, Abuja', 'Completed bridal slot', NOW() - INTERVAL '1 day')
      RETURNING *;
    `;
    const orderRes = await client.query(ordersSQL, [
      josiah.id,
      amaka.id,
      tunde.id,
      fixit.id,
      bella.id
    ]);
    const orders = orderRes.rows;

    // 8. Seed Order Items
    const orderItemsSQL = `
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES
      ($1, $6, 'Party Jollof Rice (Large)', 4500.00, 2),
      ($2, $7, 'Fried Rice + Chicken', 5200.00, 1),
      ($3, $8, 'Custom Agbada — Navy Blue', 35000.00, 1),
      ($4, $9, 'Phone Screen Replacement (iPhone 12)', 12000.00, 1),
      ($5, $10, 'Gele Styling Session', 6000.00, 1);
    `;
    await client.query(orderItemsSQL, [
      orders[0].id,
      orders[1].id,
      orders[2].id,
      orders[3].id,
      orders[4].id,
      jollof.id,
      friedRice.id,
      agbada.id,
      phoneScreen.id,
      gele.id
    ]);

    // 9. Seed Reviews (Unique constraint check on completed order ML-3302)
    const reviewsSQL = `
      INSERT INTO reviews (order_id, customer_id, vendor_id, rating, comment) VALUES
      ($1, $2, $3, 5, 'Bella was punctual, extremely polite, and my gele was the talk of the wedding! Highly recommended.');
    `;
    await client.query(reviewsSQL, [orders[4].id, josiah.id, bella.id]);

    // 10. Seed Notifications
    const notifsSQL = `
      INSERT INTO notifications (user_id, order_id, type, title, message, is_read) VALUES
      ($1, $2, 'order_status_update', 'Order #ML-3311: IN PROGRESS', 'Amaka''s Kitchen has marked your order as in progress.', false),
      ($1, $3, 'order_status_update', 'Order #ML-3306: READY', 'Your phone screen repair at FixIt Phone Repairs is ready for pickup!', false),
      ($4, $5, 'new_order', 'New Order #ML-3312', 'You received a new order for ₦9,000 from Josiah Adewale.', false);
    `;
    await client.query(notifsSQL, [
      josiah.id,
      orders[1].id,
      orders[3].id,
      amakaUser.id,
      orders[0].id
    ]);

    console.log('[SEED] Database seeding complete! Demo credentials:');
    console.log('  Admin:    admin@marketlink.com / admin123');
    console.log('  Customer: josiah@marketlink.com / password123');
    console.log('  Vendor:   amaka@marketlink.com / password123 (Amaka\'s Kitchen)');
    console.log('  Vendor:   tunde@marketlink.com / password123 (Tunde Bespoke)');
  } catch (err) {
    console.error('[SEED ERROR]', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;

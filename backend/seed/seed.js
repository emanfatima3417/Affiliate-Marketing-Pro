require("dotenv").config();
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const connectDB = require("../config/db");
const slugify = require("../utils/slugify");

const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Affiliate = require("../models/Affiliate");
const Order = require("../models/Order");
const Click = require("../models/Click");
const Commission = require("../models/Commission");
const Transaction = require("../models/Transaction");

const sampleProducts = require("./products");

const CATEGORY_NAMES = [
  "Electronics",
  "Apparel",
  "Home & Furniture",
  "Outdoor & Recreation",
  "Finance",
  "Health & Wellness",
  "Grocery",
  "Services",
];

const destroyData = async () => {
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Category.deleteMany(),
    Affiliate.deleteMany(),
    Order.deleteMany(),
    Click.deleteMany(),
    Commission.deleteMany(),
    Transaction.deleteMany(),
  ]);
  console.log("All data destroyed");
  process.exit();
};

const seedData = async () => {
  try {
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Category.deleteMany(),
      Affiliate.deleteMany(),
      Order.deleteMany(),
      Click.deleteMany(),
      Commission.deleteMany(),
      Transaction.deleteMany(),
    ]);

    console.log("Creating categories...");
    const categories = await Category.insertMany(
      CATEGORY_NAMES.map((name) => ({ name, slug: slugify(name) }))
    );
    const categoryMap = {};
    categories.forEach((c) => (categoryMap[c.name] = c._id));

    console.log("Creating users...");
    const admin = await User.create({
      name: "Platform Admin",
      email: "admin@marketplace.test",
      password: "Admin@12345",
      role: "admin",
    });

    const seller1 = await User.create({
      name: "Jordan Blake",
      email: "seller@marketplace.test",
      password: "Seller@12345",
      role: "seller",
      status: "approved",
      storeName: "Blake Trading Co.",
    });

    const seller2 = await User.create({
      name: "Priya Nair",
      email: "seller2@marketplace.test",
      password: "Seller@12345",
      role: "seller",
      status: "approved",
      storeName: "Nair Essentials",
    });

    const pendingSeller = await User.create({
      name: "Alex Rivera",
      email: "pendingseller@marketplace.test",
      password: "Seller@12345",
      role: "seller",
      status: "pending",
      storeName: "Rivera Goods",
    });

    const affiliateUser = await User.create({
      name: "Sam Carter",
      email: "affiliate@marketplace.test",
      password: "Affiliate@12345",
      role: "affiliate",
    });

    const customer = await User.create({
      name: "Taylor Morgan",
      email: "customer@marketplace.test",
      password: "Customer@12345",
      role: "customer",
    });

    const affiliate = await Affiliate.create({
      user: affiliateUser._id,
      code: `AF-${nanoid(8).toUpperCase()}`,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
      balance: 0,
    });

    console.log("Creating products...");
    const sellers = [seller1, seller2];
    const productDocs = sampleProducts.map((p, idx) => ({
      title: p.title,
      slug: slugify(p.title, nanoid(6)),
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: categoryMap[p.category],
      commissionPercent: p.commissionPercent,
      featured: p.featured,
      status: "active",
      seller: sellers[idx % sellers.length]._id,
      images: [
        {
          // Real stock photography, seeded deterministically per product slug
          // so the same product always gets the same photo on re-seed. These
          // are neutral placeholders (not literal photos of each item) - swap
          // them for real product photography via the seller dashboard's
          // Cloudinary upload before a real launch.
          url: `https://picsum.photos/seed/${slugify(p.title)}/800/800`,
          publicId: "",
        },
      ],
    }));

    const products = await Product.insertMany(productDocs);

    console.log("Creating a sample order with affiliate attribution...");
    const sampleItems = products.slice(0, 2);
    let subtotal = 0;
    const orderItems = sampleItems.map((prod) => {
      const qty = 1;
      const lineTotal = prod.price * qty;
      subtotal += lineTotal;
      const commissionAmount = Number(((lineTotal * prod.commissionPercent) / 100).toFixed(2));
      return {
        product: prod._id,
        seller: prod.seller,
        title: prod.title,
        image: prod.images[0]?.url || "",
        price: prod.price,
        quantity: qty,
        affiliate: affiliate._id,
        commissionPercent: prod.commissionPercent,
        commissionAmount,
      };
    });

    const order = await Order.create({
      orderNumber: `ORD-${nanoid(10).toUpperCase()}`,
      customer: customer._id,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      total: Number(subtotal.toFixed(2)),
      shippingAddress: {
        fullName: customer.name,
        address: "123 Market St",
        city: "Austin",
        state: "TX",
        postalCode: "73301",
        country: "USA",
        phone: "555-0100",
      },
      paymentMethod: "stripe",
      paymentStatus: "paid",
      status: "delivered",
    });

    let affiliateEarned = 0;
    for (const item of orderItems) {
      await Commission.create({
        affiliate: affiliate._id,
        order: order._id,
        product: item.product,
        seller: item.seller,
        saleAmount: item.price * item.quantity,
        percent: item.commissionPercent,
        amount: item.commissionAmount,
        status: "paid",
      });
      affiliateEarned += item.commissionAmount;
    }

    affiliate.totalClicks = 24;
    affiliate.totalConversions = 1;
    affiliate.totalEarnings = affiliateEarned;
    affiliate.totalPaid = affiliateEarned;
    affiliate.balance = 0;
    await affiliate.save();

    await Transaction.create({
      user: affiliateUser._id,
      type: "commission",
      amount: affiliateEarned,
      order: order._id,
      reference: order.orderNumber,
      status: "completed",
      notes: "Seed data - sample commission",
    });

    for (const item of sampleItems) {
      item.totalSales += 1;
      item.totalRevenue += item.price;
      await item.save();
    }

    console.log("\n===============================================");
    console.log("  Database seeded successfully!");
    console.log("===============================================");
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Products:   ${products.length}`);
    console.log("-----------------------------------------------");
    console.log("  Test accounts (password shown next to each):");
    console.log(`  Admin:            admin@marketplace.test / Admin@12345`);
    console.log(`  Seller (approved): seller@marketplace.test / Seller@12345`);
    console.log(`  Seller (approved): seller2@marketplace.test / Seller@12345`);
    console.log(`  Seller (pending):  pendingseller@marketplace.test / Seller@12345`);
    console.log(`  Affiliate:        affiliate@marketplace.test / Affiliate@12345`);
    console.log(`  Customer:         customer@marketplace.test / Customer@12345`);
    console.log("===============================================\n");

    process.exit();
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  if (process.argv.includes("-d")) {
    await destroyData();
  } else {
    await seedData();
  }
};

run();

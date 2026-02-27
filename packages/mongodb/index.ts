import mongoose from "mongoose";

import "./models/ads-report";
import "./models/audit-log";
import "./models/plan";
import "./models/store";
import "./models/order";
import "./models/product";
import "./models/integration";
import "./models/billing-invoice";
import "./models/billing-account";
import "./models/user";
import "./models/stock-movement";
import "./models/subscription";
import "./models/stock-movement";
import "./models/invoice";
import "./models/goal";

let isConnected = false;

export async function connectMongo(url: string) {
  if (isConnected) return;

  try {
    await mongoose.connect(url);
    isConnected = true;
    console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar no MongoDB:", error);
    process.exit(1);
  }
}

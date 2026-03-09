const { PrismaClient } = require("@prisma/client");

let prisma;

if (!global.__prisma) {
  prisma = new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    global.__prisma = prisma;
  }
} else {
  prisma = global.__prisma;
}

module.exports = prisma;

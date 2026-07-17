import bcrypt from "bcryptjs";
import { loadConfig } from "./config";
import { createPgStore } from "./pg-store";
import { validatePassword, validateUsername } from "./validation";
import { BCRYPT_COST } from "./app";

/* v8 ignore start -- 維護者密碼重設過渡程序（spec#23；線上化於 #310），由整合測試驗證。 */
async function main() {
  const [username, newPassword] = process.argv.slice(2);
  if (!username || !newPassword) {
    console.error("Usage: npm run reset-password -- <username> <new-password>");
    process.exit(2);
  }
  if (!validateUsername(username)) {
    console.error("Invalid username format.");
    process.exit(2);
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    console.error(`Invalid password: ${passwordError}`);
    process.exit(2);
  }
  const config = loadConfig();
  const store = await createPgStore(config.databaseUrl);
  const updated = await store.updatePassword(username, bcrypt.hashSync(newPassword, BCRYPT_COST));
  await store.close();
  if (!updated) {
    console.error(`Account not found: ${username}`);
    process.exit(1);
  }
  console.log(`Password reset for ${username}.`);
}

main().catch((error) => {
  console.error("reset-password failed:", error.message);
  process.exit(1);
});
/* v8 ignore stop */

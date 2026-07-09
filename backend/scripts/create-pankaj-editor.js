/**
 * Create / update Pankaj blog-editor account.
 *
 * Usage (from backend/ with MySQL running):
 *   node scripts/create-pankaj-editor.js
 *
 * Optional env overrides:
 *   PANKAJ_EMAIL=pankaj@kreditseva.com
 *   PANKAJ_PASSWORD=ChangeMe123!
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const NAME = 'Pankaj';
const EMAIL = process.env.PANKAJ_EMAIL || 'pankaj@kreditseva.com';
const PASSWORD = process.env.PANKAJ_PASSWORD || 'Pankaj@123';
const ROLE = 'editor';

(async () => {
  try {
    const hash = await bcrypt.hash(PASSWORD, 10);
    const [existing] = await db.query('SELECT id, role FROM admins WHERE email = ?', [EMAIL]);

    if (existing.length) {
      await db.query(
        'UPDATE admins SET name = ?, role = ?, password = ? WHERE email = ?',
        [NAME, ROLE, hash, EMAIL]
      );
      console.log(`Updated existing user → ${NAME} (${EMAIL}), role=${ROLE}`);
    } else {
      await db.query(
        'INSERT INTO admins (name, email, role, password) VALUES (?, ?, ?, ?)',
        [NAME, EMAIL, ROLE, hash]
      );
      console.log(`Created user → ${NAME} (${EMAIL}), role=${ROLE}`);
    }

    console.log('Login credentials:');
    console.log(`  Email   : ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log('  Access  : Blogs only (add / update / delete)');
  } catch (err) {
    console.error('Failed to create Pankaj user:', err.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();

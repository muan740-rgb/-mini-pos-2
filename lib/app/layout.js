import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Mini POS',
  description: 'ระบบขายของร้านเล็ก Mini POS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="navbar">
          <div className="nav-container">
            <h1 className="logo">Mini POS</h1>
            <nav>
              <ul className="nav-links">
                <li>
                  <Link href="/">จัดการสินค้า</Link>
                </li>
                <li>
                  <Link href="/sell">ขายสินค้า</Link>
                </li>
                <li>
                  <Link href="/history">ประวัติการขาย</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}

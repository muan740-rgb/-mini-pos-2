'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงรายการสินค้าทั้งหมด
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      alert('เกิดข้อผิดพลาดในการดึงรายการสินค้า: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  // คำนวณราคารวมทั้งบิล
  const grandTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.cartQty),
    0
  );

  // คำนวณจำนวนชิ้นรวมในตะกร้า
  const totalItemsCount = cart.reduce(
    (sum, item) => sum + Number(item.cartQty),
    0
  );

  // เพิ่มสินค้าเข้าตะกร้า
  function handleAddToCart(e) {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) {
      alert('กรุณาเลือกสินค้า');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      alert('กรุณาระบุจำนวนที่มากกว่า 0');
      return;
    }

    // ตรวจสอบสต็อกคงเหลือร่วมกับจำนวนที่มีในตะกร้าแล้ว
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    const currentInCart = existingIndex >= 0 ? cart[existingIndex].cartQty : 0;
    const newTotalQty = currentInCart + qty;

    if (newTotalQty > product.stock) {
      alert(
        `สินค้าคงเหลือไม่พอ! (สต็อก: ${product.stock} ${product.unit}, ในตะกร้ามีแล้ว: ${currentInCart} ${product.unit})`
      );
      return;
    }

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].cartQty = newTotalQty;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, cartQty: qty }]);
    }

    // รีเซ็ตฟอร์มเลือกสินค้า
    setSelectedProductId('');
    setQuantity(1);
  }

  // เปลี่ยนจำนวนสินค้าในตะกร้าโดยตรง
  function handleUpdateCartQty(id, newQty) {
    const qty = Number(newQty);
    const product = products.find((p) => p.id === id);

    if (qty <= 0) {
      handleRemoveFromCart(id);
      return;
    }

    if (product && qty > product.stock) {
      alert(`สินค้าคงเหลือไม่พอ! (มีเพียง ${product.stock} ${product.unit})`);
      return;
    }

    setCart(
      cart.map((item) => (item.id === id ? { ...item, cartQty: qty } : item))
    );
  }

  // ลบรายการสินค้าออกจากตะกร้า
  function handleRemoveFromCart(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  // ยืนยันการขายและชำระเงิน
  async function handleCheckout() {
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า');
      return;
    }

    if (!confirm(`ยืนยันการชำระเงิน ยอดรวม ${grandTotal.toLocaleString()} บาท?`)) {
      return;
    }

    setSubmitting(true);
    const now = new Date().toISOString();

    try {
      // 1. เตรียมข้อมูลบันทึกลงตาราง sales
      const salesData = cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.cartQty,
        total_price: Number(item.price) * item.cartQty,
        sold_at: now,
      }));

      const { error: salesError } = await supabase
        .from('sales')
        .insert(salesData);

      if (salesError) throw salesError;

      // 2. ตัดสต็อกสินค้าในตาราง products
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        const updatedStock = product.stock - item.cartQty;

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: updatedStock })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      alert('ทำรายการขายสำเร็จ!');
      setCart([]);
      fetchProducts(); // โหลดสต็อกใหม่ล่าสุด
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกการขาย: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* 1. สรุปราคารวมขนาดใหญ่ด้านบนสุด (สำหรับผู้ขายและลูกค้า) */}
      <div
        className="card"
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          textAlign: 'center',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <span style={{ fontSize: '1.1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          ยอดชำระทั้งหมด ({totalItemsCount} ชิ้น)
        </span>
        <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#4ade80', margin: '0.2rem 0' }}>
          ฿{grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* 2. พื้นที่ทำงานแบ่งเป็น 2 ฝั่งในจอเดียวกัน */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* ฝั่งซ้าย: เลือกสินค้าลงตะกร้า */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>เลือกสินค้า</h3>
          {loading ? (
            <p>กำลังโหลดรายการสินค้า...</p>
          ) : (
            <form onSubmit={handleAddToCart}>
              <div className="form-group">
                <label>รายการสินค้า</label>
                <select
                  className="form-control"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.stock <= 0}
                    >
                      {item.name} - ฿{Number(item.price).toLocaleString()} (คงเหลือ {item.stock} {item.unit})
                      {item.stock <= 0 ? ' [สินค้าหมด]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>จำนวน</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                disabled={!selectedProductId}
              >
                + เพิ่มลงตะกร้า
              </button>
            </form>
          )}
        </div>

        {/* ฝั่งขวา: รายการสินค้าในตะกร้าปัจจุบันและปุ่มชำระเงิน */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            รายการในตะกร้า ({cart.length} รายการ)
          </h3>

          {cart.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>
              ยังไม่มีสินค้าในตะกร้า
            </p>
          ) : (
            <>
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>สินค้า</th>
                      <th style={{ width: '90px' }}>จำนวน</th>
                      <th style={{ textAlign: 'right' }}>รวม</th>
                      <th style={{ textAlign: 'center', width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => {
                      const itemTotal = Number(item.price) * item.cartQty;
                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                            <br />
                            <small style={{ color: '#64748b' }}>
                              ฿{Number(item.price).toLocaleString()} / {item.unit}
                            </small>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              style={{ padding: '0.25rem 0.5rem' }}
                              value={item.cartQty}
                              onChange={(e) => handleUpdateCartQty(item.id, e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>
                            ฿{itemTotal.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                              onClick={() => handleRemoveFromCart(item.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ปุ่มรับเงิน / ชำระเงิน */}
              <button
                type="button"
                className="btn btn-success"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                }}
                onClick={handleCheckout}
                disabled={submitting}
              >
                {submitting ? 'กำลังบันทึก...' : `ชำระเงิน ฿${grandTotal.toLocaleString()}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

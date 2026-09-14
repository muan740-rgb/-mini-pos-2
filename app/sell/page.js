'use client';

import { useState, useEffect } from 'react';
// นำเข้า Supabase client (ย้อนกลับ 2 ระดับจาก app/sell/ ไปยัง lib/)
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ดึงรายการสินค้าทั้งหมดเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetchProducts();
  }, []);

  // ฟังก์ชันดึงข้อมูลสินค้าจากตาราง products
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

  // ค้นหาข้อมูลสินค้าที่ผู้ใช้เลือกในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณราคารวมอัตโนมัติ (ราคา x จำนวน)
  const totalPrice = selectedProduct
    ? Number(selectedProduct.price) * Number(quantity || 0)
    : 0;

  // ฟังก์ชันจัดการการขายสินค้า
  async function handleSell(e) {
    e.preventDefault();

    if (!selectedProduct) {
      alert('กรุณาเลือกสินค้าก่อนทำการขาย');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      alert('กรุณาระบุจำนวนสินค้าที่มากกว่า 0');
      return;
    }

    // 1. ตรวจสอบว่าจำนวนสินค้าคงเหลือ (stock) เพียงพอหรือไม่
    if (selectedProduct.stock < qty) {
      alert(
        `สินค้าคงเหลือไม่พอขาย! (คงเหลือ: ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSubmitting(true);

    try {
      // 2. บันทึกรายการขายลงตาราง sales
      const { error: saleError } = await supabase.from('sales').insert([
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: qty,
          total_price: totalPrice,
          sold_at: new Date().toISOString(),
        },
      ]);

      if (saleError) throw saleError;

      // 3. อัปเดต stock ในตาราง products ให้ลดลงตามจำนวนที่ขาย
      const updatedStock = selectedProduct.stock - qty;
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: updatedStock })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // 4. แสดงข้อความยืนยันสำเร็จและรีเซ็ตฟอร์ม
      alert(`ขายสำเร็จ! ${selectedProduct.name} จำนวน ${qty} ${selectedProduct.unit}`);
      setSelectedProductId('');
      setQuantity(1);

      // โหลดรายการสินค้าใหม่เพื่ออัปเดตข้อมูลสต็อกล่าสุดใน Dropdown
      fetchProducts();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการทำรายการ: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>ทำรายการขายสินค้า (POS)</h2>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {loading ? (
          <p>กำลังโหลดรายการสินค้า...</p>
        ) : (
          <form onSubmit={handleSell}>
            {/* Dropdown เลือกสินค้า */}
            <div className="form-group">
              <label>เลือกสินค้า</label>
              <select
                className="form-control"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
              >
                <option value="">-- กรุณาเลือกสินค้า --</option>
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - ราคา {Number(item.price).toLocaleString()} บาท (คงเหลือ: {item.stock} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* ช่องกรอกจำนวน */}
            <div className="form-group">
              <label>จำนวนที่ต้องการขาย</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* แสดงรายละเอียดสินค้าที่เลือกและราคารวมอัตโนมัติ */}
            {selectedProduct && (
              <div
                style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1.5rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <p><strong>ชื่อสินค้า:</strong> {selectedProduct.name}</p>
                <p><strong>ราคาต่อหน่วย:</strong> {Number(selectedProduct.price).toLocaleString()} บาท / {selectedProduct.unit}</p>
                <p><strong>คงเหลือในสต็อก:</strong> {selectedProduct.stock} {selectedProduct.unit}</p>
                <hr style={{ margin: '0.5rem 0', borderColor: '#cbd5e1' }} />
                <p style={{ fontSize: '1.25rem', color: '#16a34a', fontWeight: 'bold' }}>
                  ราคารวมทั้งหมด: {totalPrice.toLocaleString()} บาท
                </p>
              </div>
            )}

            {/* ปุ่มขายสินค้า */}
            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}
              disabled={submitting || !selectedProductId}
            >
              {submitting ? 'กำลังบันทึก...' : 'ยืนยันการขาย'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

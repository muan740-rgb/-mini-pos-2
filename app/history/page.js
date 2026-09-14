'use client';

import { useState, useEffect } from 'react';
// นำเข้า Supabase client (ย้อนกลับ 2 ระดับจาก app/history/ ไปยัง lib/)
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลประวัติการขายเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetchSales();
  }, []);

  // ฟังก์ชันดึงข้อมูลจากตาราง sales โดยเรียงจาก sold_at ล่าสุดไปเก่าสุด
  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการขาย: ' + error.message);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }

  // คำนวณยอดขายรวมทั้งหมด (sum ของ total_price ทุกรายการ)
  const grandTotal = sales.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  // ฟังก์ชันจัดรูปแบบวันเวลาให้อ่านง่ายในรูปแบบไทย
  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>ประวัติการขาย</h2>

      {/* สรุปยอดขายรวมทั้งหมด */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
        }}
      >
        <h3 style={{ color: '#166534', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          ยอดขายรวมทั้งหมด
        </h3>
        <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#15803d' }}>
          {grandTotal.toLocaleString()} บาท
        </p>
      </div>

      {/* ตารางแสดงรายการขาย */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>รายการขายทั้งหมด</h3>
        {loading ? (
          <p>กำลังโหลดข้อมูลประวัติการขาย...</p>
        ) : sales.length === 0 ? (
          <p>ยังไม่มีประวัติการขายในระบบ</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>วันเวลาที่ขาย</th>
                  <th>ชื่อสินค้า</th>
                  <th style={{ textAlign: 'right' }}>จำนวน</th>
                  <th style={{ textAlign: 'right' }}>ยอดรวม (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.sold_at)}</td>
                    <td>{item.product_name}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>
                      {Number(item.total_price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

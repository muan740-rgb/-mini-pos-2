'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับฟอร์มเพิ่มสินค้าใหม่
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: 'ชิ้น',
  });

  // State สำหรับแก้ไขสินค้าแบบ Inline
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: 'ชิ้น',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงรายการสินค้าทั้งหมด
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  // เพิ่มสินค้าใหม่
  async function handleAddProduct(e) {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([
      {
        sku: formData.sku,
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.stock),
        unit: formData.unit,
      },
    ]);

    if (error) {
      alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า: ' + error.message);
    } else {
      setFormData({ sku: '', name: '', price: '', stock: '', unit: 'ชิ้น' });
      fetchProducts();
    }
  }

  // เริ่มต้นแก้ไขสินค้า (นำข้อมูลเดิมลง state สำหรับแก้ไข)
  function handleStartEdit(product) {
    setEditingId(product.id);
    setEditFormData({
      sku: product.sku || '',
      name: product.name || '',
      price: product.price || 0,
      stock: product.stock || 0,
      unit: product.unit || '',
    });
  }

  // บันทึกการแก้ไขสินค้า
  async function handleUpdateProduct(id) {
    const { error } = await supabase
      .from('products')
      .update({
        sku: editFormData.sku,
        name: editFormData.name,
        price: Number(editFormData.price),
        stock: Number(editFormData.stock),
        unit: editFormData.unit,
      })
      .eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาดในการแก้ไขสินค้า: ' + error.message);
    } else {
      setEditingId(null);
      fetchProducts();
    }
  }

  // ลบสินค้า
  async function handleDeleteProduct(id) {
    if (!confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message);
    } else {
      fetchProducts();
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>จัดการรายการสินค้า</h2>

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>เพิ่มสินค้าใหม่</h3>
        <form
          onSubmit={handleAddProduct}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label className="form-group" style={{ fontSize: '0.9rem' }}>SKU</label>
            <input
              type="text"
              className="form-control"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-group" style={{ fontSize: '0.9rem' }}>ชื่อสินค้า</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-group" style={{ fontSize: '0.9rem' }}>ราคา</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-group" style={{ fontSize: '0.9rem' }}>คงเหลือ</label>
            <input
              type="number"
              className="form-control"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-group" style={{ fontSize: '0.9rem' }}>หน่วย</label>
            <input
              type="text"
              className="form-control"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              บันทึกสินค้า
            </button>
          </div>
        </form>
      </div>

      {/* ตารางแสดงสินค้า */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>รายการสินค้าทั้งหมด</h3>
        {loading ? (
          <p>กำลังโหลดข้อมูล...</p>
        ) : products.length === 0 ? (
          <p>ยังไม่มีรายการสินค้าในระบบ</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>ชื่อสินค้า</th>
                  <th>ราคา (บาท)</th>
                  <th>คงเหลือ</th>
                  <th>หน่วย</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    {editingId === item.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData.sku}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, sku: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, name: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={editFormData.price}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, price: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={editFormData.stock}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, stock: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={editFormData.unit}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, unit: e.target.value })
                            }
                          />
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn btn-success"
                            onClick={() => handleUpdateProduct(item.id)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            บันทึก
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => setEditingId(null)}
                          >
                            ยกเลิก
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.sku}</td>
                        <td>{item.name}</td>
                        <td>{Number(item.price).toLocaleString()}</td>
                        <td>{item.stock}</td>
                        <td>{item.unit}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStartEdit(item)}
                            style={{ marginRight: '0.5rem' }}
                          >
                            แก้ไข
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteProduct(item.id)}
                          >
                            ลบ
                          </button>
                        </td>
                      </>
                    )}
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

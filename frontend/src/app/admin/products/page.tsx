'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/adminApi';
import { formatRupiah } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    emoji: string;
    amount: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({ name: '', emoji: '☕', amount: 5000, sort_order: 0 });
    const [isSaving, setIsSaving] = useState(false);

    const fetchProducts = async () => {
        try {
            const response = await adminApi.getProducts();
            setProducts(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                emoji: product.emoji,
                amount: product.amount,
                sort_order: product.sort_order,
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', emoji: '☕', amount: 5000, sort_order: products.length });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (editingProduct) {
                await adminApi.updateProduct(editingProduct.id, formData);
            } else {
                await adminApi.createProduct(formData);
            }
            setShowModal(false);
            fetchProducts();
        } catch (err) {
            console.error('Failed to save product', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (product: Product) => {
        try {
            await adminApi.updateProduct(product.id, { is_active: !product.is_active });
            fetchProducts();
        } catch (err) {
            console.error('Failed to toggle product', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin hapus produk ini?')) return;
        try {
            await adminApi.deleteProduct(id);
            fetchProducts();
        } catch (err) {
            console.error('Failed to delete product', err);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produk Jajan</h1>
                    <p className="text-gray-600 dark:text-gray-400">Kelola produk jajan global</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Tambah Produk
                </button>
            </div>

            {/* Products Table */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-dark-700">
                            <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Produk</th>
                            <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Harga</th>
                            <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Order</th>
                            <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                            <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                    Belum ada produk. Klik "Tambah Produk" untuk memulai.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b border-gray-100 dark:border-dark-800">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{product.emoji}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right text-primary-600 dark:text-primary-400 font-semibold">
                                        {formatRupiah(product.amount)}
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-500">
                                        {product.sort_order}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(product)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${product.is_active
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : 'bg-gray-500/10 text-gray-500'
                                                }`}
                                        >
                                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Emoji
                                </label>
                                <input
                                    type="text"
                                    value={formData.emoji}
                                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                    className="input text-center text-2xl"
                                    maxLength={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Nama Produk
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="Kopi"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Harga (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                                    className="input"
                                    min={1000}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                    className="input"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1">
                                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

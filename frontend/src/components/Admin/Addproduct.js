import React, { useState, useEffect } from 'react';
import AdminSlideNav from './AdminSlideNav';
import { FaImage, FaTimes, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import axios from 'axios';
import styles from './Addproduct.module.css';

const TABS = [
    { key: 'add', label: 'Add Product' },
    { key: 'orders', label: 'Orders' },
    { key: 'products', label: 'Products' }
];

const AddProduct = () => {
    const [productData, setProductData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: 0
    });
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState(null);
    const [orderFilter, setOrderFilter] = useState('all'); // all, completed, uncompleted
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState(null);
    const [viewProduct, setViewProduct] = useState(null);
    const [editProduct, setEditProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('add');

    useEffect(() => {
        // Fetch orders on mount
        const fetchOrders = async () => {
            try {
                setOrdersLoading(true);
                const res = await axios.get('http://localhost:8070/orders');
                setOrders(res.data.orders || []);
            } catch (err) {
                setOrdersError('Failed to fetch orders');
            } finally {
                setOrdersLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const fetchProducts = async () => {
        try {
            setProductsLoading(true);
            const res = await axios.get('http://localhost:8070/products');
            setProducts(res.data.products || []);
        } catch (err) {
            setProductsError('Failed to fetch products');
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProductData({
            ...productData,
            [name]: value
        });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImage(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productData.name || !productData.price) {
            alert('Name and price are required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', productData.name);
            formData.append('description', productData.description);
            formData.append('category', productData.category);
            formData.append('price', productData.price);
            formData.append('stock', productData.stock);
            
            if (image) {
                formData.append('image', image);
            }

            await axios.post('http://localhost:8070/products/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Clear form after successful submission
            setProductData({
                name: '',
                description: '',
                category: '',
                price: '',
                stock: 0
            });
            setImage(null);
            setPreviewUrl(null);
            alert('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update order status
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:8070/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders => orders.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
        } catch (err) {
            alert('Failed to update order status');
        }
    };

    // Filter orders
    const filteredOrders = orders.filter(order => {
        if (orderFilter === 'completed') return order.status === 'completed';
        if (orderFilter === 'uncompleted') return order.status === 'pending' || order.status === 'processing';
        if (orderFilter === 'cancelled') return order.status === 'cancelled';
        return true;
    });

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await axios.delete(`http://localhost:8070/products/${id}`);
            setProducts(products => products.filter(p => p._id !== id));
            alert('Product deleted!');
        } catch (err) {
            alert('Failed to delete product');
        }
    };

    const handleEditProduct = (product) => {
        setEditProduct(product);
        setProductData({
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: product.stock,
        });
        setPreviewUrl(product.image ? `http://localhost:8070${product.image}` : null);
        setImage(null);
        setActiveTab('add');
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editProduct) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', productData.name);
            formData.append('description', productData.description);
            formData.append('category', productData.category);
            formData.append('price', productData.price);
            formData.append('stock', productData.stock);
            if (image) formData.append('image', image);

            await axios.put(`http://localhost:8070/products/${editProduct._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setEditProduct(null);
            setProductData({ name: '', description: '', category: '', price: '', stock: 0 });
            setImage(null);
            setPreviewUrl(null);
            fetchProducts();
            alert('Product updated!');
        } catch (err) {
            alert('Failed to update product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AdminSlideNav />
            <div className={styles.addProductContainer}>
                {/* Tab Navigation */}
                <div className={styles.tabNav}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`${styles.tabButton} ${activeTab === tab.key ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'add' && (
                    <div className={styles.addProductCard}>
                        <h2>Add New Product</h2>
                        <form onSubmit={editProduct ? handleUpdateProduct : handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name">Product Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={productData.name}
                                    onChange={handleInputChange}
                                    required
                                    className={styles.formControl}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={productData.description}
                                    onChange={handleInputChange}
                                    className={styles.formControl}
                                    rows="3"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="category">Category</label>
                                <input
                                    type="text"
                                    id="category"
                                    name="category"
                                    value={productData.category}
                                    onChange={handleInputChange}
                                    className={styles.formControl}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="price">Price *</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={productData.price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className={styles.formControl}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="stock">Stock</label>
                                <input
                                    type="number"
                                    id="stock"
                                    name="stock"
                                    value={productData.stock}
                                    onChange={handleInputChange}
                                    min="0"
                                    className={styles.formControl}
                                />
                            </div>

                            {previewUrl && (
                                <div className={styles.imagePreviewContainer}>
                                    <div className={styles.imagePreview}>
                                        <img src={previewUrl} alt="Product preview" />
                                        <button
                                            type="button"
                                            className={styles.removeImage}
                                            onClick={removeImage}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={styles.productActions}>
                                <div className={styles.mediaButtons}>
                                    <label className={styles.mediaButton}>
                                        <FaImage /> Product Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            hidden
                                        />
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    className={styles.submitProduct}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? (editProduct ? 'Updating...' : 'Adding Product...')
                                        : (editProduct ? 'Update Product' : 'Add Product')}
                                </button>
                                {editProduct && (
                                    <button
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={() => {
                                            setEditProduct(null);
                                            setProductData({ name: '', description: '', category: '', price: '', stock: 0 });
                                            setImage(null);
                                            setPreviewUrl(null);
                                        }}
                                        style={{ marginLeft: 10 }}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className={styles.addProductCard}>
                        <h2>Orders</h2>
                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setOrderFilter('all')} className={orderFilter === 'all' ? styles.activeTab : ''}>All</button>
                            <button onClick={() => setOrderFilter('completed')} className={orderFilter === 'completed' ? styles.activeTab : ''}>Completed</button>
                            <button onClick={() => setOrderFilter('uncompleted')} className={orderFilter === 'uncompleted' ? styles.activeTab : ''}>Uncompleted</button>
                            <button onClick={() => setOrderFilter('cancelled')} className={orderFilter === 'cancelled' ? styles.activeTab : ''}>Cancelled</button>
                        </div>
                        {ordersLoading ? (
                            <div>Loading orders...</div>
                        ) : ordersError ? (
                            <div style={{ color: 'red' }}>{ordersError}</div>
                        ) : filteredOrders.length === 0 ? (
                            <div>No orders found.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                            <table className={styles.ordersTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Address</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Products</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order._id}</td>
                                            <td>{order.user?.name || '-'}</td>
                                            <td>{order.user?.email || order.email}</td>
                                            <td>{order.address}</td>
                                            <td>{order.phone}</td>
                                            <td>
                                                <select value={order.status} onChange={e => handleStatusChange(order._id, e.target.value)}>
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td>
                                                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                                    {order.products.map((item, idx) => (
                                                        <li key={idx}>
                                                            {item.product?.name || item.product} x {item.quantity}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className={styles.addProductCard}>
                        <h2>Products</h2>
                        {productsLoading ? (
                            <div>Loading products...</div>
                        ) : productsError ? (
                            <div style={{ color: 'red' }}>{productsError}</div>
                        ) : products.length === 0 ? (
                            <div>No products found.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className={styles.ordersTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Stock</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(product => (
                                            <tr key={product._id}>
                                                <td>
                                                    {product.image && (
                                                        <img src={`http://localhost:8070${product.image}`} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                                                    )}
                                                </td>
                                                <td>{product.name}</td>
                                                <td>{product.category}</td>
                                                <td>{product.price}</td>
                                                <td>{product.stock}</td>
                                                <td>
                                                    <button onClick={() => setViewProduct(product)} title="View"><FaEye /></button>
                                                    <button onClick={() => handleEditProduct(product)} title="Edit"><FaEdit /></button>
                                                    <button onClick={() => handleDeleteProduct(product._id)} title="Delete"><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {viewProduct && (
    <div className={styles.modalOverlay}>
        <div className={styles.modal}>
            <h2>{viewProduct.name}</h2>
            {viewProduct.image && (
                <img src={`http://localhost:8070${viewProduct.image}`} alt={viewProduct.name} style={{ width: 180, borderRadius: 8, marginBottom: 12 }} />
            )}
            <p><b>Category:</b> {viewProduct.category}</p>
            <p><b>Price:</b> {viewProduct.price}</p>
            <p><b>Stock:</b> {viewProduct.stock}</p>
            <p><b>Description:</b> {viewProduct.description}</p>
            <button onClick={() => setViewProduct(null)} className={styles.cancelButton}>Close</button>
        </div>
    </div>
)}
        </>
    );
};

export default AddProduct;
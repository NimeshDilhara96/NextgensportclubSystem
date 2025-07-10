import React, { useState } from 'react';
import AdminSlideNav from './AdminSlideNav';
import { FaImage, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import styles from './Addproduct.module.css';

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

    return (
        <>
            <AdminSlideNav />
            <div className={styles.addProductContainer}>
                <div className={styles.addProductCard}>
                    <h2>Add New Product</h2>
                    <form onSubmit={handleSubmit}>
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
                                {isSubmitting ? 'Adding Product...' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AddProduct;
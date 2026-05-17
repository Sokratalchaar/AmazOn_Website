const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'products.json');

app.use(cors());
app.use(express.json());

// Utility to read data
const readData = () => {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

// Utility to write data
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// GET all products
app.get('/api/products', (req, res) => {
  try {
    const products = readData();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error reading products' });
  }
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  try {
    const products = readData();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error reading product' });
  }
});

// POST new product
app.post('/api/products', (req, res) => {
  try {
    const products = readData();
    const newProduct = {
      id: Date.now(), // simple unique id generator
      title: req.body.title,
      price: parseFloat(req.body.price),
      description: req.body.description,
      image: req.body.image,
      category: req.body.category,
      rating: req.body.rating || 0
    };
    
    products.push(newProduct);
    writeData(products);
    
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error adding product' });
  }
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  try {
    const products = readData();
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (index === -1) return res.status(404).json({ message: 'Product not found' });
    
    products[index] = {
      ...products[index],
      ...req.body,
      id: products[index].id // Ensure ID cannot be changed
    };
    
    writeData(products);
    res.json(products[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  try {
    const products = readData();
    const filteredProducts = products.filter(p => p.id !== parseInt(req.params.id));
    
    if (products.length === filteredProducts.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    writeData(filteredProducts);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

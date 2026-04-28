const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public/client')));
app.use('/administrator', express.static(path.join(__dirname, 'public/administrator')));

const DATA_FILE = path.join(__dirname, 'menu.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

const printerConfig = {
    host: process.env.PRINTER_HOST || '192.168.88.4',
    port: Number(process.env.PRINTER_PORT || 9100),
    enabled: process.env.PRINTER_ENABLED !== 'false'
};

const getMenu = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ categories: [] }, null, 4));
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content || '{"categories":[]}');
    } catch (e) {
        return { categories: [] };
    }
};

const saveMenu = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));

const getOrders = () => {
    try {
        if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 4));
        const content = fs.readFileSync(ORDERS_FILE, 'utf8');
        return JSON.parse(content || '[]');
    } catch (e) {
        return [];
    }
};

const saveOrders = (orders) => fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 4));

const formatOrderForPrinter = (order) => {
    // ESC/POS commands for Greek character support
    // ESC @ - Initialize printer
    // ESC t 17 - Select code page PC737 (DOS Greek) - Try 21 for ISO8859-7 if needed
    // ESC R 17 - Select international character set Greek
    let buffer = Buffer.from([
        0x1B, 0x40, // ESC @ - Initialize printer
        0x1B, 0x74, 0x11, // ESC t 17 - Select code page PC737 (DOS Greek)
        0x1B, 0x52, 0x11  // ESC R 17 - Select international character set Greek
    ]);

    const lines = [];
    lines.push('*** ΠΑΡΑΓΓΕΛΙΑ ***');
    lines.push(`Αριθμός: ${order.id}`);
    lines.push(`Ημ/νία: ${new Date(order.timestamp).toLocaleString('el-GR')}`);
    lines.push('------------------------------');
    lines.push(`Πελάτης: ${order.customer.name || 'Ανώνυμος'}`);
    if (order.customer.phone) lines.push(`Τηλ: ${order.customer.phone}`);
    if (order.customer.address) lines.push(`Διεύθυνση: ${order.customer.address}`);
    if (order.customer.comments) lines.push(`Σχόλια: ${order.customer.comments}`);
    lines.push('------------------------------');
    order.items.forEach(item => {
        const itemName = item.option ? `${item.name} (${item.option})` : item.name;
        lines.push(`${item.qty} x ${itemName}`);
        lines.push(`  @ ${item.unitPrice.toFixed(2)}€ = ${(item.unitPrice * item.qty).toFixed(2)}€`);
    });
    lines.push('------------------------------');
    lines.push(`Σύνολο: ${order.total.toFixed(2)}€`);
    lines.push('------------------------------');
    lines.push('Ευχαριστούμε!');
    lines.push('\n\n\n');

    // Convert text to latin1 encoding (compatible with Greek code pages)
    const textBuffer = Buffer.from(lines.join('\n'), 'latin1');

    // Combine initialization commands with text
    return Buffer.concat([buffer, textBuffer]);
};

const printOrder = (order) => {
    if (!printerConfig.enabled) {
        console.log('Printer disabled by configuration. Skipping print.');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const socket = net.connect(printerConfig.port, printerConfig.host, () => {
            socket.write(formatOrderForPrinter(order), () => socket.end());
        });

        socket.setTimeout(10000, () => {
            socket.destroy();
            reject(new Error('Printer connection timeout'));
        });

        socket.on('error', (error) => reject(error));
        socket.on('close', () => resolve());
    });
};

// --- API ROUTES (Κοινά και για τους δύο) ---
app.get('/api/menu', (req, res) => res.json(getMenu()));
app.get('/api/orders', (req, res) => res.json(getOrders()));

app.post('/api/orders', (req, res) => {
    const { customer = {}, items = [], orderType = 'takeaway', tableNumber = null } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Το καλάθι είναι άδειο.' });
    }

    const normalizedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        option: item.option || null,
        unitPrice: Number(item.unitPrice) || 0,
        qty: Number(item.qty) || 0
    }));

    const total = normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

    const order = {
        id: Date.now(),
        customer: {
            name: String(customer.name || '').trim(),
            phone: String(customer.phone || '').trim(),
            address: String(customer.address || '').trim(),
            comments: String(customer.comments || '').trim()
        },
        items: normalizedItems,
        total,
        status: 'pending',
        printRequested: true,
        printState: 'pending',
        printAttempts: 0,
        printLog: [],
        timestamp: new Date().toISOString(),
        orderType,
        tableNumber: orderType === 'dinein' ? tableNumber : null
    };

    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    res.json({ success: true, order });
});

app.get('/api/print-jobs', (req, res) => {
    const jobs = getOrders().filter(order => order.printRequested === true && order.printState !== 'printed');
    res.json(jobs);
});

app.post('/api/orders/:id/print', (req, res) => {
    const orders = getOrders();
    const order = orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.printRequested = true;
    order.printState = 'pending';
    order.printLog = order.printLog || [];
    saveOrders(orders);
    res.json({ success: true, order });
});

app.post('/api/orders/:id/print-status', (req, res) => {
    const orders = getOrders();
    const order = orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const state = req.body.printState || 'printed';
    const note = String(req.body.note || '').trim();
    order.printState = state;
    order.printAttempts = Number(order.printAttempts || 0) + 1;
    order.printLog = order.printLog || [];
    if (note) order.printLog.push({ time: new Date().toISOString(), note });
    if (state === 'printed') {
        order.printRequested = false;
    }

    saveOrders(orders);
    res.json({ success: true, order });
});

app.put('/api/orders/:id/status', (req, res) => {
    const orders = getOrders();
    const order = orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = req.body.status || order.status;
    saveOrders(orders);
    res.json({ success: true, order });
});

app.put('/api/orders/:id', (req, res) => {
    const orders = getOrders();
    const order = orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.customer = {
        name: String(req.body.customer?.name || order.customer.name || '').trim(),
        phone: String(req.body.customer?.phone || order.customer.phone || '').trim(),
        address: String(req.body.customer?.address || order.customer.address || '').trim(),
        comments: String(req.body.customer?.comments || order.customer.comments || '').trim()
    };
    order.status = String(req.body.status || order.status);
    saveOrders(orders);

    res.json({ success: true, order });
});

app.post('/api/orders/:id/print', (req, res) => {
    const orders = getOrders();
    const order = orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    printOrder(order)
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
});

// --- ADMIN API ROUTES ---
app.post('/api/categories', (req, res) => {
    const menu = getMenu();
    menu.categories.push({ id: Date.now(), name: req.body.name, items: [], available: true });
    saveMenu(menu);
    res.json({ success: true });
});

app.post('/api/items', (req, res) => {
    const menu = getMenu();
    const { categoryId, name, price, description, image, extras } = req.body;
    const cat = menu.categories.find(c => c.id == categoryId);
    if (cat) {
        cat.items.push({ id: Date.now(), name, base_price: parseFloat(price) || 0, description, image, extras, available: true });
        saveMenu(menu);
        res.json({ success: true });
    } else res.status(404).send('Category not found');
});

app.put('/api/items/:catId/:itemId', (req, res) => {
    const menu = getMenu();
    const cat = menu.categories.find(c => c.id == req.params.catId);
    if (cat) {
        const item = cat.items.find(i => i.id == req.params.itemId);
        if (item) {
            Object.assign(item, {
                name: req.body.name,
                base_price: parseFloat(req.body.price) || 0,
                description: req.body.description,
                image: req.body.image,
                extras: req.body.extras
            });
            saveMenu(menu);
            return res.json({ success: true });
        }
    }
    res.status(404).json({ error: 'Item not found' });
});

app.put('/api/categories/:id/availability', (req, res) => {
    const menu = getMenu();
    const cat = menu.categories.find(c => c.id == req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    cat.available = req.body.available === true;
    saveMenu(menu);
    res.json({ success: true });
});

app.put('/api/items/:catId/:itemId/availability', (req, res) => {
    const menu = getMenu();
    const cat = menu.categories.find(c => c.id == req.params.catId);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const item = cat.items.find(i => i.id == req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    item.available = req.body.available === true;
    saveMenu(menu);
    res.json({ success: true });
});

app.delete('/api/items/:catId/:itemId', (req, res) => {
    const menu = getMenu();
    const cat = menu.categories.find(c => c.id == req.params.catId);
    if (cat) {
        cat.items = cat.items.filter(i => i.id != req.params.itemId);
        saveMenu(menu);
        return res.json({ success: true });
    }
    res.status(404).json({ error: 'Category not found' });
});

app.delete('/api/categories/:id', (req, res) => {
    const menu = getMenu();
    menu.categories = menu.categories.filter(c => c.id != req.params.id);
    saveMenu(menu);
    res.json({ success: true });
});

// --- Σελίδες ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/client/index.html'));
});

app.get('/administrator', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/administrator/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Client View: http://localhost:${PORT}`);
    console.log(`🛠️ Admin View: http://localhost:${PORT}/administrator`);
    console.log(`🖨️ Printer: ${printerConfig.enabled ? `${printerConfig.host}:${printerConfig.port}` : 'disabled'}`);
});
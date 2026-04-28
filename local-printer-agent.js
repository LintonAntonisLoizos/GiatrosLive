const express = require('express');
const net = require('net');

const CLOUD_API_URL = process.env.CLOUD_API_URL || 'http://localhost:3000';
const LOCAL_PRINTER_HOST = process.env.LOCAL_PRINTER_HOST || '192.168.88.4';
const LOCAL_PRINTER_PORT = Number(process.env.LOCAL_PRINTER_PORT || 9100);
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL_SECONDS || 10) * 1000;
const STATUS_PORT = Number(process.env.STATUS_PORT || 4000);

const state = {
    lastPoll: null,
    lastError: null,
    pendingJobs: [],
    recentLogs: []
};

const app = express();
app.use(express.json());

const log = (message) => {
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} - ${message}`;
    state.recentLogs.unshift(entry);
    if (state.recentLogs.length > 50) state.recentLogs.pop();
    console.log(entry);
};

const buildPrintBuffer = (order) => {
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
    if (order.orderType) {
        lines.push(`Τύπος: ${order.orderType === 'dinein' ? 'Στο κατάστημα' : 'Παραλαβή/Delivery'}`);
    }
    if (order.tableNumber) lines.push(`Τραπέζι: ${order.tableNumber}`);
    lines.push('------------------------------');
    lines.push('Ευχαριστούμε!');
    lines.push('\n\n\n');

    // Convert text to latin1 encoding (compatible with Greek code pages)
    const textBuffer = Buffer.from(lines.join('\n'), 'latin1');

    // Combine initialization commands with text
    return Buffer.concat([buffer, textBuffer]);
};

const sendPrintStatus = async (orderId, status, note = '') => {
    try {
        const response = await fetch(`${CLOUD_API_URL}/api/orders/${orderId}/print-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printState: status, note })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || response.statusText);
        log(`Reported print status ${status} for order ${orderId}`);
    } catch (error) {
        log(`Failed to update print status for order ${orderId}: ${error.message}`);
    }
};

const printToLocalPrinter = (buffer) => {
    return new Promise((resolve, reject) => {
        const socket = net.connect(LOCAL_PRINTER_PORT, LOCAL_PRINTER_HOST, () => {
            socket.write(buffer, () => socket.end());
        });

        socket.setTimeout(10000, () => {
            socket.destroy();
            reject(new Error('Printer connection timeout'));
        });

        socket.on('error', (error) => reject(error));
        socket.on('close', () => resolve());
    });
};

const pollPrintJobs = async () => {
    try {
        state.lastPoll = new Date().toISOString();
        const response = await fetch(`${CLOUD_API_URL}/api/print-jobs`);
        if (!response.ok) {
            throw new Error(`Cloud returned ${response.status}`);
        }

        const jobs = await response.json();
        state.pendingJobs = jobs;
        log(`Found ${jobs.length} print job(s).`);

        for (const order of jobs) {
            try {
                log(`Printing order ${order.id}...`);
                const buffer = buildPrintBuffer(order);
                await printToLocalPrinter(buffer);
                await sendPrintStatus(order.id, 'printed', 'Printed locally');
                log(`Order ${order.id} printed successfully.`);
            } catch (error) {
                await sendPrintStatus(order.id, 'failed', error.message);
                log(`Order ${order.id} print failed: ${error.message}`);
            }
        }
    } catch (error) {
        state.lastError = error.message;
        log(`Polling error: ${error.message}`);
    }
};

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="UTF-8" />
<title>Local Printer Agent</title>
<style>body{font-family:Segoe UI,sans-serif;background:#f8f9fa;color:#333;margin:0;padding:20px}h1{color:#2c3e50}pre{background:#fff;padding:15px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);overflow:auto;max-height:420px}</style>
</head>
<body>
<h1>Local Printer Agent</h1>
<p>Cloud API: <strong>${CLOUD_API_URL}</strong></p>
<p>Printer: <strong>${LOCAL_PRINTER_HOST}:${LOCAL_PRINTER_PORT}</strong></p>
<p>Last poll: <strong>${state.lastPoll || 'Δεν έχει γίνει ακόμα'}</strong></p>
<p>Last error: <strong>${state.lastError || 'Κανένα'}</strong></p>
<p>Pending jobs: <strong>${state.pendingJobs.length}</strong></p>
<h2>Recent logs</h2>
<pre>${state.recentLogs.join('\n')}</pre>
</body>
</html>`);
});

app.get('/status.json', (req, res) => res.json(state));

app.listen(STATUS_PORT, () => {
    log(`Local agent running on http://localhost:${STATUS_PORT}`);
    log(`Polling cloud every ${POLL_INTERVAL / 1000}s`);
    pollPrintJobs();
    setInterval(pollPrintJobs, POLL_INTERVAL);
});

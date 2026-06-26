import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connection setup (Works out-of-the-box with a local MongoDB installation)
const MONGO_URI = 'mongodb://127.0.0.1:27017'; 
const client = new MongoClient(MONGO_URI);

let db, transactionsCollection;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('tracker_db');
        transactionsCollection = db.collection('transactions');
        console.log('Connected successfully to MongoDB');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}
connectDB();

// 2. GET: Fetch all transactions from Mongo
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await transactionsCollection.find({}).toArray();
        // Map _id to id so your frontend code stays exactly the same
        const formattedData = transactions.map(t => ({
            id: t._id,
            text: t.text,
            amount: t.amount,
            type: t.type
        }));
        res.json(formattedData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. POST: Insert a new transaction into Mongo
app.post('/api/transactions', async (req, res) => {
    try {
        const { text, amount, type } = req.body;
        const newTransaction = {
            text,
            amount: parseFloat(amount),
            type
        };
        
        const result = await transactionsCollection.insertOne(newTransaction);
        res.status(201).json({ id: result.insertedId, ...newTransaction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE: Remove a transaction from Mongo by its ID
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await transactionsCollection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Backend running at http://localhost:3000'));

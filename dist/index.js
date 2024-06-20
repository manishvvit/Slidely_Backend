"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const promises_1 = __importDefault(require("fs/promises"));
const app = (0, express_1.default)();
const PORT = 3000;
const DB_FILE = './db.json';
// Middleware to parse JSON bodies
app.use(body_parser_1.default.json());
// Endpoint to check if server is running
app.get('/ping', (req, res) => {
    res.json({ success: true });
});
// Endpoint to submit form data
app.post('/submit', async (req, res) => {
    try {
        const { name, email, phone, github, stopwatchTime } = req.body;
        // Validate input fields
        if (!name || !email || !phone || !github || !stopwatchTime) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        // Read existing submissions from db.json
        const submissions = await readSubmissions();
        // Add new submission
        const newSubmission = { name, email, phone, github, stopwatchTime };
        submissions.push(newSubmission);
        // Write updated submissions back to db.json
        await writeSubmissions(submissions);
        res.json({ message: 'Submission saved successfully!', submission: newSubmission });
    }
    catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});
// Endpoint to read a specific submission by index
app.get('/read', async (req, res) => {
    try {
        const index = Number(req.query.index);
        // Validate index parameter
        if (isNaN(index)) {
            return res.status(400).json({ error: 'Invalid index parameter. It should be a number.' });
        }
        const submissions = await readSubmissions();
        // Validate index range
        if (index < 0 || index >= submissions.length) {
            return res.status(404).json({ error: 'Submission not found.' });
        }
        const submission = submissions[index];
        res.json(submission);
    }
    catch (error) {
        console.error('Error reading submission:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
// Endpoint to edit a submission by index
app.put('/edit', async (req, res) => {
    try {
        const index = Number(req.query.index);
        const { name, email, phone, github, stopwatchTime } = req.body;
        // Validate index parameter
        if (isNaN(index)) {
            return res.status(400).json({ error: 'Invalid index parameter. It should be a number.' });
        }
        // Validate input fields
        if (!name || !email || !phone || !github || !stopwatchTime) {
            return res.status(400).json({ error: 'All fields are required for updating.' });
        }
        const submissions = await readSubmissions();
        // Validate index range
        if (index < 0 || index >= submissions.length) {
            return res.status(404).json({ error: 'Submission not found.' });
        }
        // Update the submission at the specified index
        submissions[index] = { name, email, phone, github, stopwatchTime };
        // Write updated submissions back to db.json
        await writeSubmissions(submissions);
        res.json({ message: 'Submission updated successfully!', submission: submissions[index] });
    }
    catch (error) {
        console.error('Error editing submission:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
// Endpoint to delete a submission by index
app.delete('/delete', async (req, res) => {
    try {
        const index = Number(req.query.index);
        // Validate index parameter
        if (isNaN(index)) {
            return res.status(400).json({ error: 'Invalid index parameter. It should be a number.' });
        }
        const submissions = await readSubmissions();
        // Validate index range
        if (index < 0 || index >= submissions.length) {
            return res.status(404).json({ error: 'Submission not found.' });
        }
        // Remove the submission at the specified index
        const deletedSubmission = submissions.splice(index, 1);
        // Write updated submissions back to db.json
        await writeSubmissions(submissions);
        res.json({ message: 'Submission deleted successfully!', submission: deletedSubmission });
    }
    catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});
// Endpoint for handling requests to the root path ("/")
app.get('/', (req, res) => {
    res.send('Welcome to the Submission Backend Server!');
});
// Helper function to read submissions from db.json
async function readSubmissions() {
    try {
        const data = await promises_1.default.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        // If db.json doesn't exist yet, return an empty array
        if (error && typeof error === 'object' && 'code' in error && error['code'] === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
// Helper function to write submissions to db.json
async function writeSubmissions(submissions) {
    await promises_1.default.writeFile(DB_FILE, JSON.stringify(submissions, null, 2));
}
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

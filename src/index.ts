import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs/promises';

const app = express();
const PORT = 3000;
const DB_FILE = './db.json';

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to check if server is running
app.get('/ping', (req: Request, res: Response) => {
  res.json({ success: true });
});

// Endpoint to submit form data
app.post('/submit', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error submitting form:', error);
    if (error && typeof error === 'object' && 'code' in error && error['code'] === 'ENOENT') {
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
});

// Endpoint to read a specific submission by index
app.get('/read', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error reading submission:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint to edit a specific submission by index
app.put('/edit', async (req: Request, res: Response) => {
  try {
    const index = Number(req.query.index);
    const { name, email, phone, github, stopwatchTime } = req.body;

    // Validate input fields
    if (!name || !email || !phone || !github || !stopwatchTime) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const submissions = await readSubmissions();

    // Validate index range
    if (index < 0 || index >= submissions.length) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Update submission
    submissions[index] = { name, email, phone, github, stopwatchTime };

    // Write updated submissions back to db.json
    await writeSubmissions(submissions);

    res.json({ message: 'Submission updated successfully!', submission: submissions[index] });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint to delete a specific submission by index
app.delete('/delete', async (req: Request, res: Response) => {
  try {
    const index = Number(req.query.index);

    const submissions = await readSubmissions();

    // Validate index range
    if (index < 0 || index >= submissions.length) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Remove submission
    const deletedSubmission = submissions.splice(index, 1)[0];

    // Write updated submissions back to db.json
    await writeSubmissions(submissions);

    res.json({ message: 'Submission deleted successfully!', submission: deletedSubmission });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint to search submissions by name, email, phone, or github
app.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.query?.toString().toLowerCase() || '';
    const submissions = await readSubmissions();

    const filteredSubmissions = submissions.filter(submission => 
      submission.name.toLowerCase().includes(query) ||
      submission.email.toLowerCase().includes(query) ||
      submission.phone.toLowerCase().includes(query) ||
      submission.github.toLowerCase().includes(query)
    );

    res.json(filteredSubmissions);
  } catch (error) {
    console.error('Error searching submissions:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint to get total count of submissions
app.get('/count', async (req: Request, res: Response) => {
  try {
    const submissions = await readSubmissions();
    res.json({ count: submissions.length });
  } catch (error) {
    console.error('Error fetching total submissions count:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint for handling requests to the root path ("/")
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the Submission Backend Server!');
});

// Helper function to read submissions from db.json
async function readSubmissions(): Promise<any[]> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If db.json doesn't exist yet, return an empty array
    if (error && typeof error === 'object' && 'code' in error && error['code'] === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Helper function to write submissions to db.json
async function writeSubmissions(submissions: any[]): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(submissions, null, 2));
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

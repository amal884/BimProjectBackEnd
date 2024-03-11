// Require the express module
const express = require('express');

const bodyParser = require('body-parser');

// Create an instance of express
const app = express();

// Define a port for the server to listen on
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');



const mysql = require('mysql');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost', // Change this to your MySQL server host
  user: 'root', // Change this to your MySQL username
  password: '', // Change this to your MySQL password
  database: 'magic_plan' // Change this to your MySQL database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});






app.get('/', (req, res) => {
    res.send('Welcome to the PDF Generation Service');
  });
// POST endpoint to receive form data and generate PDF
// POST endpoint to receive form data and generate PDF
app.post('/submit-form', (req, res) => {
  const formData = req.body;
  console.log('Received form data:', formData);

  // Serialize the formData object to JSON
  const formDataJson = JSON.stringify(formData);

  // Insert the formDataJson into the table
  connection.query('INSERT INTO form_report (formDataJson) VALUES (?)', [formDataJson], (err, results) => {
    if (err) {
      console.error('Error inserting form data:', err);
      res.status(500).json({ error: 'Could not submit the form.' });
      return;
    }
    console.log('Form data inserted:', results.insertId);

    // Respond with a message indicating successful form submission
    // Optionally, return a path or URL to access the generated PDF
    res.json({ message: 'Form submitted successfully!', pdfUrl: 'http://10.2.49.11:3000/download-pdf' });
  });

  // Path where the PDF will be saved
  const pdfPath = path.join(__dirname, 'Output.pdf');

  // Generate PDF with form data here
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(pdfPath));
  doc.fontSize(12).text(`Adresse: ${formData.adresse}`, 100, 100);

  // Add more fields from formData as needed
  doc.end();
});

  
  // GET endpoint to download the generated PDF
  app.get('/download-pdf', (req, res) => {
    const pdfPath = path.join(__dirname, 'Output.pdf');
    res.download(pdfPath, 'FormOutput.pdf', (err) => {
      if (err) {
        console.error('Error downloading the PDF:', err);
        return res.status(500).send('Error downloading the PDF');
      }
    });
  });
  

app.get('/generate-pdf', (req, res) => {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, 'Output.pdf');
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(25).text('Hello, PDF World!', 100, 100);
    doc.end();

    stream.on('finish', () => {
        console.log('PDF has finished writing to file');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Output.pdf`);

        res.download(filePath, 'Output.pdf', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.sendStatus(500);
            } else {
                console.log('File sent successfully');
                // Deletion should occur in the callback after successful sending
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                    else console.log('File deleted successfully');
                });
            }
        });
    });

    stream.on('error', err => {
        console.error('Error with PDF stream:', err);
        res.sendStatus(500);
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });


  process.on('SIGINT', () => {
    connection.end((err) => {
      if (err) {
        console.error('Error closing MySQL connection:', err);
        process.exit(1);
      }
      console.log('MySQL connection closed');
      process.exit(0);
    });
  });
  


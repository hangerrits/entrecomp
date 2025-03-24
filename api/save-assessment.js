const fs = require('fs').promises;
const path = require('path');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Validate input
      if (!req.body.user || !req.body.user.name || !req.body.user.email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid user information' 
        });
      }

      // Generate a unique, safe filename
      const sanitizedName = req.body.user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 50);
      const timestamp = Date.now();
      const filename = `assessment_${sanitizedName}_${timestamp}.json`;
      
      // Use /tmp directory for Vercel serverless functions
      const filePath = path.join('/tmp', filename);
      
      // Write the assessment data to a file
      await fs.writeFile(filePath, JSON.stringify({
        ...req.body,
        savedAt: new Date().toISOString()
      }, null, 2));
      
      res.status(200).json({ 
        success: true, 
        filename: filename 
      });
    } catch (error) {
      console.error('Save error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}